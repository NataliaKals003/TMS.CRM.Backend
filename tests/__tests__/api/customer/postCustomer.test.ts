import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { APIGatewayProxyEventBuilder } from '../../../builders/apiGatewayProxyEventBuilder.js';
import { selectCustomerByExternalUuid } from '../../../../repositories/customerRepository.js';
import { handler } from '../../../../lambdas/api/customer/postCustomer.js';
import type { TenantEntry } from '../../../../models/database/tenantEntry.js';
import { knexClient } from '../../../../lib/utils/knexClient.js';
import { tenantTableName } from '../../../../repositories/tenantRepository.js';
import { TenantEntryBuilder } from '../../../builders/tenantEntryBuilder.js';

describe('API - Customer - POST', () => {
  const tenantsGlobal: TenantEntry[] = [];

  beforeAll(async () => {
    const tenant = await knexClient(tenantTableName).insert(TenantEntryBuilder.make().withName('Tenant 1').build()).returning('*');
    tenantsGlobal.push(...tenant);
  });

  it('Success - Should create a customer', async () => {
    const payload = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '123-456-7890',
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
      imageUrl: 'https://example.com/profile.jpg',
    };

    const event = APIGatewayProxyEventBuilder.make()
      .withQueryStringParameters({
        // TODO: Remove this once the tenantId is pulled from the token
        tenantId: tenantsGlobal[0].Id.toString(),
      })
      .withBody(payload)
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(201);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).data;
    expect(resultData.uuid).toBeDefined();
    expect(resultData.firstName).toBe(payload.firstName);
    expect(resultData.lastName).toBe(payload.lastName);
    expect(resultData.email).toBe(payload.email);
    expect(resultData.phone).toBe(payload.phone);
    expect(resultData.street).toBe(payload.street);
    expect(resultData.city).toBe(payload.city);
    expect(resultData.state).toBe(payload.state);
    expect(resultData.zipCode).toBe(payload.zipCode);
    expect(resultData.imageUrl).toBe(payload.imageUrl);
    expect(resultData.createdOn).toBeDefined();
    expect(resultData.modifiedOn).toBeNull();

    // Validate the database record
    const customer = await selectCustomerByExternalUuid(resultData.uuid);
    expect(customer).toBeDefined();
  });

  it('Error - Should return a 400 error if the body is missing required fields', async () => {
    const event = APIGatewayProxyEventBuilder.make()
      .withBody({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
      })
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).message;
    expect(resultData).toBe('Missing fields: phone, street, city, state, zipCode');
  });
});
