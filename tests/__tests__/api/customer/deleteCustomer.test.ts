import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { APIGatewayProxyEventBuilder } from '../../../builders/apiGatewayProxyEventBuilder.js';
import { knexClient } from '../../../../lib/utils/knexClient.js';
import { randomUUID } from 'crypto';
import type { CustomerEntry } from '../../../../models/database/customerEntry.js';
import { customerTableName, selectCustomerByExternalUuid } from '../../../../repositories/customerRepository.js';
import { CustomerEntryBuilder } from '../../../builders/customerEntryBuilder.js';
import { handler } from '../../../../lambdas/api/customer/deleteCustomer.js';

describe('API - Customer - DELETE', () => {
  const customersGlobal: CustomerEntry[] = [];

  beforeAll(async () => {
    const customer = await knexClient(customerTableName)
      .insert(
        CustomerEntryBuilder.make()
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
      )
      .returning('*');

    customersGlobal.push(...customer);
  });

  it('Success - Should delete a customer', async () => {
    const event = APIGatewayProxyEventBuilder.make()
      .withPathParameters({
        uuid: customersGlobal[0].ExternalUuid,
      })
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(204);
    expect(res.body).toBeDefined();

    // Validate the database record
    const customer = await selectCustomerByExternalUuid(customersGlobal[0].ExternalUuid);
    expect(customer?.DeletedOn).toBeDefined();
  });

  it('Error - Should return a 400 error if the path parameter is missing', async () => {
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
    // Event missing the uuid path parameter
    const event = APIGatewayProxyEventBuilder.make().withPathParameters({ uuid: randomUUID() }).build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).message;
    expect(resultData).toBe('Customer not found');
  });
});
