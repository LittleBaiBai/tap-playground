# tap-playground

Get existing supply chain installed (fish shell commands):

```
set SUPPLY_CHAIN_PACKAGE ootb-delivery-basic
set SUPPLY_CHAIN_PACKAGE ootb-templates
set SUPPLY_CHAIN_PACKAGE ootb-supply-chain-testing-scanning

imgpkg pull -b (kubectl get app $SUPPLY_CHAIN_PACKAGE -n tap-install -o jsonpath={.spec.fetch[0].imgpkgBundle.image}) -o supply-chains/$SUPPLY_CHAIN_PACKAGE
```

Guide to modify existing supply chain: <https://docs.vmware.com/en/Tanzu-Application-Platform/1.1/tap/GUID-scc-authoring-supply-chains.html>

TODO:

- [ ] Figure out where does httpproxy gets created and how to get a hold of that URL
- [ ] Create a Tekton task in templates to make a POST call to httpbin
- [ ] Use that task in a custom supply chain
