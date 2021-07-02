import core = require("@aws-cdk/core");
import s3 = require("@aws-cdk/aws-s3");
import ec2 = require("@aws-cdk/aws-ec2");
import log = require('@aws-cdk/aws-logs');
import iam = require("@aws-cdk/aws-iam");
import cfn = require("@aws-cdk/aws-cloudformation");
import lambda = require("@aws-cdk/aws-lambda");

import * as fs from 'fs';
import { CfnAccessPoint } from "@aws-cdk/aws-s3";

export class BlueprintVpcs extends core.Construct {
  
  public readonly ProductionVpc: ec2.Vpc;
  public readonly ManagementVPC: ec2.Vpc;
  public readonly DevelopmentVpc: ec2.Vpc;
  public readonly ManagementVpcDnsIp: string;
  
  constructor(scope: core.Construct, id: string, props: core.StackProps) {
    super(scope, id);

    this.ProductionVpc = new ec2.Vpc(this, 'Production', {
        cidr: '10.50.0.0/16',          
        maxAzs: 2,    
        natGateways: 1,
        subnetConfiguration: [
          { 
            cidrMask: 23,
            subnetType: ec2.SubnetType.PUBLIC,    
            name: 'DMZ',
          },
          {
            cidrMask: 23,
            name: 'Application',
            subnetType: ec2.SubnetType.PRIVATE,
          },
          {
            cidrMask: 23,
            name: 'Database',
            subnetType: ec2.SubnetType.ISOLATED,    
          }
        ],
        gatewayEndpoints: {
          S3: {
            service: ec2.GatewayVpcEndpointAwsService.S3,
          }
        }
    });
  
    this.DevelopmentVpc = new ec2.Vpc(this, 'Development', {
        cidr: '10.60.0.0/16',          
        maxAzs: 2,    
        natGateways: 1,
        subnetConfiguration: [
          {
            cidrMask: 23,
            subnetType: ec2.SubnetType.PUBLIC,    
            name: 'DMZ',
          },
          {
            cidrMask: 23,
            name: 'Application',
            subnetType: ec2.SubnetType.PRIVATE,
          },
          {
            cidrMask: 23,
            name: 'Database',
            subnetType: ec2.SubnetType.ISOLATED,    
          }
        ],
        gatewayEndpoints: {
          S3: {
            service: ec2.GatewayVpcEndpointAwsService.S3,
          }
        }
    });
  

    let managementCidr = '10.70.0.0/16';

    let baseRangeAndMask = managementCidr.split('/');
    let baseRangeOctets = baseRangeAndMask[0].split('.');
    let baseOctetPlusTwo = Number(baseRangeOctets[3]) + 2;
    this.ManagementVpcDnsIp = `${baseRangeOctets[0]}.${baseRangeOctets[1]}.${baseRangeOctets[2]}.${baseOctetPlusTwo}`;

    this.ManagementVPC = new ec2.Vpc(this, 'Management', {
        cidr: managementCidr,          
        maxAzs: 2,    
        natGateways: 1,
        subnetConfiguration: [
          {
            cidrMask: 23,
            subnetType: ec2.SubnetType.PUBLIC,    
            name: 'DMZ',
          },
          {
            cidrMask: 23,
            name: 'Application',
            subnetType: ec2.SubnetType.PRIVATE,
          }
        ]
    });
      
    const mgmtToProductionPeering = new ec2.CfnVPCPeeringConnection(this, 'ManagementToProductionPeering', {
        vpcId: this.ManagementVPC.vpcId,
        peerVpcId: this.ProductionVpc.vpcId
    });
  
    const mgmtToDevPeering = new ec2.CfnVPCPeeringConnection(this, 'ManagementToDevelopmentPeering', {
        vpcId: this.ManagementVPC.vpcId,
        peerVpcId: this.DevelopmentVpc.vpcId
    });
  
    const publicSubnetSelection = { subnetType: ec2.SubnetType.PUBLIC };
    const privateSubnetSelection = { subnetType: ec2.SubnetType.PRIVATE };
    const isolatedSubnetSelection = { subnetType: ec2.SubnetType.ISOLATED };
    

    // Management <-> Dev

    this.createRoutesForSubnetClass(`mgmtPublicToDev`,this.ManagementVPC, publicSubnetSelection, this.DevelopmentVpc, mgmtToDevPeering );
    this.createRoutesForSubnetClass(`mgmtPrivateToDev`,this.ManagementVPC, privateSubnetSelection, this.DevelopmentVpc, mgmtToDevPeering );
    this.createRoutesForSubnetClass(`devPublicToMgmt`,this.DevelopmentVpc, publicSubnetSelection, this.ManagementVPC, mgmtToDevPeering );
    this.createRoutesForSubnetClass(`devPrivateToMgmt`,this.DevelopmentVpc, privateSubnetSelection, this.ManagementVPC, mgmtToDevPeering );
    this.createRoutesForSubnetClass(`devIsolatedToMgmt`,this.DevelopmentVpc, isolatedSubnetSelection, this.ManagementVPC, mgmtToDevPeering );

    // Management <-> Prod

    this.createRoutesForSubnetClass(`mgmtPublicToProd`,this.ManagementVPC, publicSubnetSelection, this.ProductionVpc, mgmtToProductionPeering );
    this.createRoutesForSubnetClass(`mgmtPrivateToProd`,this.ManagementVPC, privateSubnetSelection, this.ProductionVpc, mgmtToProductionPeering );
    this.createRoutesForSubnetClass(`prodPublicToMgmt`,this.ProductionVpc, publicSubnetSelection, this.ManagementVPC, mgmtToProductionPeering );
    this.createRoutesForSubnetClass(`prodPrivateToMgmt`,this.ProductionVpc, privateSubnetSelection, this.ManagementVPC, mgmtToProductionPeering );
    //this.createRoutesForSubnetClass(`ProdIsolatedToMgmt`,developmentVPC, isolatedSubnetSelection, managementVPC, mgmtToDevPeering );
  }

  private createRoutesForSubnetClass(name: string, sourceVPC: ec2.Vpc, sourceSubnetType: any, destinationVPC: ec2.Vpc, peeringConnection: ec2.CfnVPCPeeringConnection ){
    
    sourceVPC.selectSubnets(sourceSubnetType).subnets.forEach((subnet, index) => {
      new ec2.CfnRoute(this, `${name}-${index}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: destinationVPC.vpcCidrBlock,
        vpcPeeringConnectionId: peeringConnection.ref
      });
    });
  }
}