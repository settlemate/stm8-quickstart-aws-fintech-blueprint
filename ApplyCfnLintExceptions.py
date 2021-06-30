import os
import json 

templateStream = open('./templates/SwiftDigitalConnectivity.template.json', 'r')
templateData = json.load(templateStream)

for resource in templateData['Resources']:
    if templateData['Resources'][resource]['Metadata']['aws:cdk:path'] == 'SwiftDigitalConnectivity/product/codeBuildProjectRole/DefaultPolicy/Resource':
        templateData['Resources'][resource]['Metadata']['cfn-lint'] = {
            "config": {
                "ignore_checks": ['EIAMPolicyActionWildcard']
            }
        }
        
    if templateData['Resources'][resource]['Metadata']['aws:cdk:path'] == 'SwiftDigitalConnectivity/product/quickstart-swift-digital-connectivity-pipeline/ArtifactsBucketEncryptionKey/Resource':
        templateData['Resources'][resource]['Metadata']['cfn-lint'] = {
            "config": {
                "ignore_checks": ['EIAMPolicyActionWildcard', 'EIAMPolicyWildcardResource']
            }
        }        



    
with open('./templates/SwiftDigitalConnectivity.template.json', 'w') as json_file:
    json.dump(templateData, json_file, indent=2)