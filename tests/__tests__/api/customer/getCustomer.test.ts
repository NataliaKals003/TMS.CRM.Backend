import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { APIGatewayProxyEventBuilder } from '../../../builders/apiGatewayProxyEventBuilder.js';
import { knexClient } from '../../../../lib/utils/knexClient.js';
import { randomUUID } from 'crypto';
import type { TenantEntry } from '../../../../models/database/tenantEntry.js';
import { tenantTableName } from '../../../../repositories/tenantRepository.js';
import { TenantEntryBuilder } from '../../../builders/tenantEntryBuilder.js';
import type { CustomerEntry } from '../../../../models/database/customerEntry.js';
import { customerTableName, selectCustomerByExternalUuid } from '../../../../repositories/customerRepository.js';
import { CustomerEntryBuilder } from '../../../builders/customerEntryBuilder.js';
import { handler } from '../../../../lambdas/api/customer/getCustomer.js';

describe('API - Customer - GET', () => {
  const tenantsGlobal: TenantEntry[] = [];
  const customersGlobal: CustomerEntry[] = [];

  beforeAll(async () => {
    const tenant = await knexClient(tenantTableName).insert(TenantEntryBuilder.make().withName('Tenant 1').build()).returning('*');

    tenantsGlobal.push(...tenant);

    const customer = await knexClient(customerTableName)
      .insert([
        CustomerEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withFirstName('John')
          .withLastName('Doe')
          .withEmail('john.doe@example.com')
          .withPhone('642103273576')
          .withStreet('202/3 Rose Garden Lane')
          .withCity('Auckland')
          .withState('Auckland Region')
          .withZipCode('0632')
          .withCustomerImageUrl('http/1234')
          .build(),
        CustomerEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withFirstName('Jane')
          .withLastName('Pan')
          .withEmail('jane.pan@example.com')
          .withPhone('642103273576')
          .withStreet('103/4 Rose Garden Lane')
          .withCity('Auckland')
          .withState('Auckland Region')
          .withZipCode('0632')
          .withCustomerImageUrl('http/1234')
          .build(),
      ])
      .returning('*');

    customersGlobal.push(...customer);
  });

  it('Success - Should get a customer', async () => {
    const event = APIGatewayProxyEventBuilder.make()
      .withPathParameters({
        uuid: customersGlobal[0].ExternalUuid,
      })
      .withQueryStringParameters({
        // TODO: Remove this once the tenantId is pulled from the token
        tenantId: tenantsGlobal[0].Id.toString(),
      })
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).data;
    expect(resultData.firstName).toBe(customersGlobal[0].FirstName);
    expect(resultData.lastName).toBe(customersGlobal[0].LastName);
    expect(resultData.email).toBe(customersGlobal[0].Email);
    expect(resultData.phone).toBe(customersGlobal[0].Phone);
    expect(resultData.street).toBe(customersGlobal[0].Street);
    expect(resultData.city).toBe(customersGlobal[0].City);
    expect(resultData.state).toBe(customersGlobal[0].State);
    expect(resultData.zipCode).toBe(customersGlobal[0].ZipCode);
    expect(resultData.imageUrl).toBe(customersGlobal[0].ImageUrl);
    expect(resultData.uuid).toBeDefined();
    expect(resultData.createdOn).toBeDefined();
    expect(resultData.modifiedOn).toBeDefined();
  });

  it('Error - Should return a 400 error if the path parameter is missing', async () => {
    // Event missing the uuid path parameter
    const event = APIGatewayProxyEventBuilder.make().build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).message;
    expect(resultData).toBe('Missing path parameters: uuid');
  });

  it('Error - Should return a 400 error if the customer does not exist', async () => {
    // Event with a random uuid on the path parameter
    const event = APIGatewayProxyEventBuilder.make()
      .withPathParameters({ uuid: randomUUID() })
      .withQueryStringParameters({
        // TODO: Remove this once the tenantId is pulled from the token
        tenantId: tenantsGlobal[0].Id.toString(),
      })
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).message;
    expect(resultData).toBe('Customer not found');
  });
});
