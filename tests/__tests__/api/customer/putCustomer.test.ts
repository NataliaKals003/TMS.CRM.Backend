import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { APIGatewayProxyEventBuilder } from '../../../builders/apiGatewayProxyEventBuilder.js';
import { knexClient } from '../../../../lib/utils/knexClient.js';
import { randomUUID } from 'crypto';
import type { CustomerEntry } from '../../../../models/database/customerEntry.js';
import { customerTableName, selectCustomerByExternalUuid } from '../../../../repositories/customerRepository.js';
import { CustomerEntryBuilder } from '../../../builders/customerEntryBuilder.js';
import type { PutCustomerRequestPayload } from '../../../../models/api/payloads/customer.js';
import { handler } from '../../../../lambdas/api/customer/putCustomer.js';

describe('API - Customer - PUT', () => {
  const customersGlobal: CustomerEntry[] = [];

  beforeAll(async () => {
    const customer = await knexClient(customerTableName)
      .insert(
        CustomerEntryBuilder.make()
          .withFirstName('John')
          .withLastName('Doe')
          .withEmail('john.doe@example.com')
          .withPhone('123-456-7890')
          .withStreet('123 Main St')
          .withCity('Springfield')
          .withState('IL')
          .withZipCode('62704')
          .withProfileImageUrl('https://example.com/profile.jpg')
          .build(),
      )
      .returning(['Id', 'ExternalUuid', 'FirstName', 'LastName', 'Phone', 'Street', 'City', 'State', 'ZipCode', 'ProfileImageUrl']);

    customersGlobal.push(...customer);
  });

  it('Success - Should update a customer', async () => {
    const payload: PutCustomerRequestPayload = {
      firstName: customersGlobal[0].FirstName,
      lastName: customersGlobal[0].LastName,
      email: 'new.john.doe@example.com',
      phone: customersGlobal[0].Phone,
      street: customersGlobal[0].Street,
      city: 'Los Angeles',
      state: customersGlobal[0].State,
      zipCode: customersGlobal[0].ZipCode,
      profileImageUrl: customersGlobal[0].ProfileImageUrl,
    };

    const event = APIGatewayProxyEventBuilder.make()
      .withPathParameters({
        uuid: customersGlobal[0].ExternalUuid,
      })
      .withBody(payload)
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(201);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).data;
    expect(resultData.firstName).toBe(payload.firstName);
    expect(resultData.lastName).toBe(payload.lastName);
    expect(resultData.email).toBe(payload.email);
    expect(resultData.phone).toBe(payload.phone);
    expect(resultData.street).toBe(payload.street);
    expect(resultData.city).toBe(payload.city);
    expect(resultData.state).toBe(payload.state);
    expect(resultData.zipCode).toBe(payload.zipCode);
    expect(resultData.profileImageUrl).toBe(payload.profileImageUrl);
    expect(resultData.uuid).toBeDefined();
    expect(resultData.createdOn).toBeDefined();
    expect(resultData.modifiedOn).toBeDefined();

    // Validate the database record
    const customer = await selectCustomerByExternalUuid(resultData.uuid);
    expect(customer).toBeDefined();
    expect(customer!.Email).toBe(payload.email);
  });

  it('Error - Should return a 400 error if the path parameter is missing', async () => {
    const payload: PutCustomerRequestPayload = {
      firstName: customersGlobal[0].FirstName,
      lastName: customersGlobal[0].LastName,
      email: 'new.john.doe@example.com',
      phone: customersGlobal[0].Phone,
      street: customersGlobal[0].Street,
      city: 'Los Angeles',
      state: customersGlobal[0].State,
      zipCode: customersGlobal[0].ZipCode,
      profileImageUrl: customersGlobal[0].ProfileImageUrl,
    };

    // Event missing the uuid path parameter
    const event = APIGatewayProxyEventBuilder.make().withBody(payload).build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).errorMessage;
    expect(resultData).toBe('Missing path parameters: uuid');
  });

  it('Error - Should return a 400 error if the body is missing required fields', async () => {
    // Payload missing the email and city
    const payload: Partial<PutCustomerRequestPayload> = {
      firstName: customersGlobal[0].FirstName,
      lastName: customersGlobal[0].LastName,
      phone: customersGlobal[0].Phone,
      street: customersGlobal[0].Street,
      state: customersGlobal[0].State,
      zipCode: customersGlobal[0].ZipCode,
      profileImageUrl: customersGlobal[0].ProfileImageUrl,
    };

    // Event missing the uuid path parameter
    const event = APIGatewayProxyEventBuilder.make().withPathParameters(payload).withBody(payload).build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).errorMessage;
    expect(resultData).toBe('Missing fields: email, city');
  });

  it('Error - Should return a 400 error if the usecustomerr does not exist', async () => {
    const payload: PutCustomerRequestPayload = {
      firstName: 'Marcus',
      lastName: 'Aurelius',
      email: 'marcus.aurelius@example.com',
      phone: '987-654-3210',
      street: '456 Elm St',
      city: 'Rome',
      state: 'IT',
      zipCode: '00100',
      profileImageUrl: 'https://example.com/marcus.jpg',
    };

    // Event missing the uuid path parameter
    const event = APIGatewayProxyEventBuilder.make().withPathParameters({ uuid: randomUUID() }).withBody(payload).build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).errorMessage;
    expect(resultData).toBe('Customer not found');
  });
});
