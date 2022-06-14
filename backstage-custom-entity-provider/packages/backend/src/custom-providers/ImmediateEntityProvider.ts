import {
    ANNOTATION_LOCATION,
    ANNOTATION_ORIGIN_LOCATION,
    Entity,
    entitySchemaValidator,
} from '@backstage/catalog-model';
import { InputError } from '@backstage/errors';
import {
    DeferredEntity,
    EntityProvider,
    EntityProviderConnection,
    parseEntityYaml,
} from '@backstage/plugin-catalog-backend';
import bodyParser from 'body-parser';
import express from 'express';
import Router from 'express-promise-router';
import lodash from 'lodash';
import { Logger } from 'winston';

/**
 * Provides entities using an endpoint
 **/
export class ImmediateEntityProvider implements EntityProvider {
    private connection?: EntityProviderConnection;
    private readonly entityValidator: (data: unknown) => Entity;

    constructor(private readonly options: ImmediateEntityProviderOptions) {
        this.entityValidator = entitySchemaValidator();
        console.log("Instantiated me");
    }

    /** {@inheritdoc @backstage/plugin-catalog-backend#EntityProvider.getProviderName} */
    getProviderName() {
        return `ImmediateEntityProvider`;
    }

    /** {@inheritdoc @backstage/plugin-catalog-backend#EntityProvider.connect} */
    async connect(connection: EntityProviderConnection) {
        this.connection = connection;
    }

    getRouter(): express.Router {
        console.log("Router instantiated");
        const router = Router();

        router.get('/hello', )

        router.use(bodyParser.raw({ type: '*/*' }));

        router.post('/entities', async (req, res) => {
            console.log("POST received");
            if (!this.connection) {
                throw new Error(`Service is not yet initialized`);
            }
            const deferred = await this.getRequestBodyEntities(req);
            await this.connection.applyMutation({
                type: 'delta',
                added: deferred,
                removed: [],
            });
            res.status(201).end();
        });

        router.put('/entities', async (req, res) => {
            console.log("PUT received");
            if (!this.connection) {
                throw new Error(`Service is not yet initialized`);
            }
            const deferred = await this.getRequestBodyEntities(req);
            await this.connection.applyMutation({
                type: 'full',
                entities: deferred,
            });
            res.status(201).end();
        });

        return router;
    }

    private async getRequestBodyEntities(
        req: express.Request,
    ): Promise<DeferredEntity[]> {
        if (!Buffer.isBuffer(req.body) || !req.body.length) {
            throw new InputError(`Missing request body`);
        }

        const result: DeferredEntity[] = [];

        for await (const item of parseEntityYaml(req.body, {
            type: 'immediate',
            target: 'immediate',
        })) {
            if (item.type === 'entity') {
                const deferred: DeferredEntity = {
                    entity: lodash.merge(
                        {
                            metadata: {
                                annotations: {
                                    [ANNOTATION_ORIGIN_LOCATION]: 'immediate:immediate',
                                    [ANNOTATION_LOCATION]: 'immediate:immediate',
                                },
                            },
                        },
                        item.entity,
                    ),
                    locationKey: `immediate:`,
                };

                await this.options.handleEntity?.(req, deferred);
                deferred.entity = this.entityValidator(deferred.entity);

                result.push(deferred);
            } else if (item.type === 'error') {
                throw new InputError(`Malformed entity YAML, ${item.error}`);
            } else {
                throw new InputError(`Internal error, failed to parse entity`);
            }
        }

        return result;
    }
}

/**
 * Options for {@link ImmediateEntityProvider}.
 */
export interface ImmediateEntityProviderOptions {
    /**
     * The logger to use.
     */
    logger: Logger;

    /**
     * An optional function to perform adjustments to, or validate, an incoming
     * entity before being stored. It is permitted to modify the deferred entity,
     * but the request is static and has had its body consumed.
     */
    handleEntity?: (
        request: express.Request,
        deferred: DeferredEntity,
    ) => void | Promise<void>;
}