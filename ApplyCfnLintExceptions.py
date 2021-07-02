import os
import json 

templateStream = open('./templates/SwiftDigitalConnectivity.template.json', 'r')
templateData = json.load(templateStream)

for resource in templateData['Resources']:
    if templateData['Resources'][resource]['Metadata']['aws:cdk:path'] == 'SwiftDigitalConnectivity/product/codeBuildProjectRole/DefaultPolicy/Resource':
        templateData['Resources'][resource]['Metadata']['cfn-lint'] = {
            "config": {
                "ignore_checks": ['EIAMPolicyActionWildcard'],
                "ignore_reasons": {
                    "EIAMPolicyActionWildcard": "This policy is created by the AWS CDKs pipeline construct which the developers of this quickstart have no control over."
                }
                    
            }
        }
        
    if templateData['Resources'][resource]['Metadata']['aws:cdk:path'] == 'SwiftDigitalConnectivity/product/quickstart-swift-digital-connectivity-pipeline/ArtifactsBucketEncryptionKey/Resource':
        templateData['Resources'][resource]['Metadata']['cfn-lint'] = {
            "config": {
                "ignore_checks": ['EIAMPolicyActionWildcard', 'EIAMPolicyWildcardResource'],
                "ignore_reasons": {
                    "EIAMPolicyActionWildcard": "This policy is created by the AWS CDKs pipeline construct which the developers of this quickstart have no control over.",
                    "EIAMPolicyWildcardResource": "This policy is created by the AWS CDKs pipeline construct which the developers of this quickstart have no control over."
                }
                    
            }
        }        

    if templateData['Resources'][resource]['Metadata']['aws:cdk:path'] == 'SwiftDigitalConnectivity/product/quickstart-swift-digital-connectivity-pipeline/Source/InitRepo/CodePipelineActionRole/DefaultPolicy/Resource' \
    or templateData['Resources'][resource]['Metadata']['aws:cdk:path'] == 'SwiftDigitalConnectivity/product/quickstart-swift-digital-connectivity-pipeline/Role/DefaultPolicy/Resource':
        templateData['Resources'][resource]['Metadata']['cfn-lint'] = {
            "config": {
                "ignore_checks": ['EIAMPolicyActionWildcard'],
                "ignore_reasons": {
                    "EIAMPolicyActionWildcard": "This policy is created by the AWS CDKs pipeline construct which the developers of this quickstart have no control over."
                }
                    
            }
        } 

    
with open('./templates/SwiftDigitalConnectivity.template.json', 'w') as json_file:
    json.dump(templateData, json_file, indent=2)