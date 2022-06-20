# tap-playground

Get existing supply chain installed (fish shell commands):

```
set SUPPLY_CHAIN_PACKAGE ootb-delivery-basic
set SUPPLY_CHAIN_PACKAGE ootb-templates
set SUPPLY_CHAIN_PACKAGE ootb-supply-chain-testing-scanning

imgpkg pull -b (kubectl get app $SUPPLY_CHAIN_PACKAGE -n tap-install -o jsonpath={.spec.fetch[0].imgpkgBundle.image}) -o supply-chains/$SUPPLY_CHAIN_PACKAGE
```

Guide to modify existing supply chain: <https://docs.vmware.com/en/Tanzu-Application-Platform/1.1/tap/GUID-scc-authoring-supply-chains.html>

Writing a Tekton task: <https://tekton.dev/docs/pipelines/taskruns/>

To try the new stuff on a full profile TAP cluster:

```
kubectl apply -f supply-chains/api-entity-task.yaml
kubectl apply -f supply-chains/api-entity-template.yaml
kubectl apply -f supply-chains/test-cluster-delivery.yaml
kubectl apply -f supply-chains/deliverable-with-annotations-template.yaml

ytt \
  --ignore-unknown-comments \
  --file supply-chains/ootb-supply-chain-testing-scanning/config \
  --file supply-chains/ootb-supply-chain-testing-scanning/values.yaml \
  --data-value registry.server=$(kubectl get secret tap-values -n tap-install -o jsonpath="{.data['tap-values\.yaml']}" | base64 -d | yq eval '.ootb_supply_chain_testing_scanning.registry.server' -) \
  --data-value registry.repository=$(kubectl get secret tap-values -n tap-install -o jsonpath="{.data['tap-values\.yaml']}" | base64 -d | yq eval '.ootb_supply_chain_testing_scanning.registry.repository' -) |
  kubectl apply -f-

tanzu apps workload delete petclinic-api-entity -y
tanzu apps workload create -f supply-chains/test-workload.yaml -y
```

TODO:

- [x] Figure out where does httpproxy gets created and how to get a hold of that URL
- [x] Create a Tekton task in templates to make a POST call to httpbin
- [x] Consume Workload annotations in this Tekton task
- [x] Use that task in a custom supply chain
- [x] Call TAP GUI url in the task
- [x] Try out ImmediateEntityProvider with backstage
- [ ] Securing entity provider endpoint
- [ ] How to infer Lifecycle from delivery pipeline? Annotation?
- [ ] What do we put in Team? Annotation?
- [x] Assume we don't need tags for now?
