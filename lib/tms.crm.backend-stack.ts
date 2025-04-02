import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';

export class TmsCrmBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const serviceName = 'tms-crm-backend';

    // VPC Setup
    const vpc = new ec2.Vpc(this, `${serviceName}Vpc`, {
      maxAzs: 2, // Use 2 Availability Zones for high availability
      cidr: '10.0.0.0/16', // Explicitly define CIDR range
    });

    // RDS Instance
    const dbInstance = new rds.DatabaseInstance(this, `${serviceName}Database`, {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS, // Place DB in private subnets
      },
      credentials: rds.Credentials.fromGeneratedSecret('postgres'), // Automatically generate admin password
      databaseName: 'tmscrmdb',
      storageEncrypted: true, // Enable encryption at rest
      backupRetention: cdk.Duration.days(7),
      deletionProtection: process.env.NODE_ENV === 'production', // Disable deletion protection for dev environments
      multiAz: process.env.NODE_ENV === 'production', // Enable Multi-AZ for production
    });

    // Shared Environment Variables
    const lambdaEnvironment = {
      DB_HOST: dbInstance.dbInstanceEndpointAddress,
      DB_PORT: dbInstance.dbInstanceEndpointPort,
      DB_NAME: 'tmscrmdb',
      DB_USER: 'postgres',
      DB_PASSWORD: dbInstance.secret?.secretValueFromJson('password').unsafeUnwrap() || '',
    };

    // Lambda Factory Function
    const createLambdaFunction = (scope: Construct, id: string, handlerPath: string, serviceName: string): lambda.Function => {
      return new lambda.Function(scope, `${serviceName}${id}Lambda`, {
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: `${handlerPath}.handler`,
        code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/api')),
        environment: lambdaEnvironment,
        timeout: cdk.Duration.seconds(10), // Set timeout for Lambda functions
        memorySize: 256, // Allocate sufficient memory for Lambda functions
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      });
    };

    // Lambda Functions
    const usersLambda = createLambdaFunction(this, 'Users', 'user/getUsers', 'Get');
    const createUserLambda = createLambdaFunction(this, 'CreateUser', 'user/postUser', 'Post');
    const updateUserLambda = createLambdaFunction(this, 'UpdateUser', 'user/putUser', 'Put');
    const deleteUserLambda = createLambdaFunction(this, 'DeleteUser', 'user/deleteUser', 'Delete');

    const customersLambda = createLambdaFunction(this, 'Customers', 'customer/getCustomers', 'Get');
    const createCustomerLambda = createLambdaFunction(this, 'CreateCustomer', 'customer/postCustomer', 'Post');
    const updateCustomerLambda = createLambdaFunction(this, 'UpdateCustomer', 'customer/putCustomer', 'Put');
    const deleteCustomerLambda = createLambdaFunction(this, 'DeleteCustomer', 'customer/deleteCustomer', 'Delete');

    const dealsLambda = createLambdaFunction(this, 'Deals', 'deal/getDeals', 'Get');
    const createDealLambda = createLambdaFunction(this, 'CreateDeal', 'deal/postDeal', 'Post');
    const updateDealLambda = createLambdaFunction(this, 'UpdateDeal', 'deal/putDeal', 'Put');
    const deleteDealLambda = createLambdaFunction(this, 'DeleteDeal', 'deal/deleteDeal', 'Delete');

    const tasksLambda = createLambdaFunction(this, 'Tasks', 'task/getTasks', 'Get');
    const createTaskLambda = createLambdaFunction(this, 'CreateTask', 'task/postTask', 'Post');
    const updateTaskLambda = createLambdaFunction(this, 'UpdateTask', 'task/putTask', 'Put');
    const deleteTaskLambda = createLambdaFunction(this, 'DeleteTask', 'task/deleteTask', 'Delete');

    const activitiesLambda = createLambdaFunction(this, 'Activities', 'activity/getActivities', 'Get');
    const createActivityLambda = createLambdaFunction(this, 'CreateActivity', 'activity/postActivity', 'Post');
    const updateActivityLambda = createLambdaFunction(this, 'UpdateActivity', 'activity/putActivity', 'Put');
    const deleteActivityLambda = createLambdaFunction(this, 'DeleteActivity', 'activity/deleteActivity', 'Delete');

    // API Gateway
    const api = new apigateway.RestApi(this, `${serviceName}Api`, {
      restApiName: `${serviceName}BackendApi`,
      description: 'API Gateway for TMS CRM Backend',
      deployOptions: {
        stageName: 'prod',
      },
    });

    // Users Route
    const usersIntegration = new apigateway.LambdaIntegration(usersLambda);
    const usersResource = api.root.addResource('users');
    usersResource.addMethod('GET', usersIntegration);
    usersResource.addMethod('POST', new apigateway.LambdaIntegration(createUserLambda));
    const userUuidResource = usersResource.addResource('{uuid}');
    userUuidResource.addMethod('GET', usersIntegration);
    userUuidResource.addMethod('PUT', new apigateway.LambdaIntegration(updateUserLambda));
    userUuidResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteUserLambda));

    // Customers Route
    const customersIntegration = new apigateway.LambdaIntegration(customersLambda);
    const customersResource = api.root.addResource('customers');
    customersResource.addMethod('GET', customersIntegration);
    customersResource.addMethod('POST', new apigateway.LambdaIntegration(createCustomerLambda));
    const customerUuidResource = customersResource.addResource('{uuid}');
    customerUuidResource.addMethod('GET', customersIntegration);
    customerUuidResource.addMethod('PUT', new apigateway.LambdaIntegration(updateCustomerLambda));
    customerUuidResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteCustomerLambda));

    // Deals Route
    const dealsIntegration = new apigateway.LambdaIntegration(dealsLambda);
    const dealsResource = api.root.addResource('deals');
    dealsResource.addMethod('GET', dealsIntegration);
    dealsResource.addMethod('POST', new apigateway.LambdaIntegration(createDealLambda));
    const dealUuidResource = dealsResource.addResource('{uuid}');
    dealUuidResource.addMethod('GET', dealsIntegration);
    dealUuidResource.addMethod('PUT', new apigateway.LambdaIntegration(updateDealLambda));
    dealUuidResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteDealLambda));

    // Tasks Route
    const tasksIntegration = new apigateway.LambdaIntegration(tasksLambda);
    const tasksResource = api.root.addResource('tasks');
    tasksResource.addMethod('GET', tasksIntegration);
    tasksResource.addMethod('POST', new apigateway.LambdaIntegration(createTaskLambda));
    const taskUuidResource = tasksResource.addResource('{uuid}');
    taskUuidResource.addMethod('GET', tasksIntegration);
    taskUuidResource.addMethod('PUT', new apigateway.LambdaIntegration(updateTaskLambda));
    taskUuidResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteTaskLambda));

    // Activities Route
    const activitiesIntegration = new apigateway.LambdaIntegration(activitiesLambda);
    const activitiesResource = api.root.addResource('activities');
    activitiesResource.addMethod('GET', activitiesIntegration);
    activitiesResource.addMethod('POST', new apigateway.LambdaIntegration(createActivityLambda));
    const activityUuidResource = activitiesResource.addResource('{uuid}');
    activityUuidResource.addMethod('GET', activitiesIntegration);
    activityUuidResource.addMethod('PUT', new apigateway.LambdaIntegration(updateActivityLambda));
    activityUuidResource.addMethod('DELETE', new apigateway.LambdaIntegration(deleteActivityLambda));

    // Outputs
    new cdk.CfnOutput(this, `${serviceName}ApiUrl`, {
      value: api.url ?? 'No URL available',
      description: 'The URL of the API Gateway',
    });

    new cdk.CfnOutput(this, `${serviceName}DatabaseEndpoint`, {
      value: dbInstance.dbInstanceEndpointAddress,
      description: 'The endpoint of the RDS database',
    });

    new cdk.CfnOutput(this, `${serviceName}DatabaseSecretArn`, {
      value: dbInstance.secret?.secretArn ?? 'No secret ARN available',
      description: 'The ARN of the RDS database secret',
    });
  }
}
