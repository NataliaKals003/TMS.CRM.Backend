import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { APIGatewayProxyEventBuilder } from '../../../builders/apiGatewayProxyEventBuilder.js';
import { selectUserByExternalUuid, userTableName } from '../../../../repositories/userRepository.js';
import { UserEntryBuilder } from '../../../builders/userEntryBuilder.js';
import type { UserEntry } from '../../../../models/database/userEntry.js';
import { knexClient } from '../../../../lib/utils/knexClient.js';
import type { PutUserRequestPayload } from '../../../../models/api/payloads/user.js';
import { randomUUID } from 'crypto';
import type { CustomerEntry } from '../../../../models/database/customerEntry.js';
import { customerTableName, selectCustomerByExternalUuid } from '../../../../repositories/customerRepository.js';
import { CustomerEntryBuilder } from '../../../builders/customerEntryBuilder.js';
import type { PutCustomerRequestPayload } from '../../../../models/api/payloads/customer.js';
import { handler } from '../../../../lambdas/api/customer/putCustomer.js';
import type { TenantEntry } from '../../../../models/database/tenantEntry.js';

describe('API - Customer - PUT', () => {
  const tenantsGlobal: TenantEntry[] = [];
  const customersGlobal: CustomerEntry[] = [];

  beforeAll(async () => {
    const customer = await knexClient(customerTableName)
      .insert(
        CustomerEntryBuilder.make()
          .withFirstName('John')
          .withLastName('Doe')
          .withEmail('john.doe@example.com')
          .withPhone('1234567890')
          .withStreet('234/Rose')
          .withCity('Auckland')
          .withState('AKL')
          .withZipCode('1010')
          .withCustomerImageUrl('https://example.com/image.jpg')
          .build(),
      )
      .returning(['*']);

    customersGlobal.push(...customer);
  });

  it('Success - Should update a customer', async () => {
    const payload: PutCustomerRequestPayload = {
      firstName: customersGlobal[0].FirstName,
      lastName: customersGlobal[0].LastName,
      email: 'new.john.doe@example.com',
      phone: customersGlobal[0].Phone,
      street: customersGlobal[0].Street,
      city: customersGlobal[0].City,
      state: customersGlobal[0].State,
      zipCode: customersGlobal[0].ZipCode,
      customerImageUrl: String(customersGlobal[0].ImageUrl),
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
    expect(resultData.customerImageUrl).toBe(payload.customerImageUrl);

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
      city: customersGlobal[0].City,
      state: customersGlobal[0].State,
      zipCode: customersGlobal[0].ZipCode,
      customerImageUrl: String(customersGlobal[0].ImageUrl),
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
    // Payload missing the email, phone, street, city, state, zipCode
    const payload: Partial<PutCustomerRequestPayload> = {
      firstName: customersGlobal[0].FirstName,
      lastName: customersGlobal[0].LastName,
      // email: customersGlobal[0].Email,
      // phone: customersGlobal[0].Phone,
      // street: customersGlobal[0].Street,
      // city: customersGlobal[0].City,
      // state: customersGlobal[0].State,
      // zipCode: customersGlobal[0].ZipCode,
      customerImageUrl: String(customersGlobal[0].ImageUrl),
    };

    // Event missing the uuid path parameter
    const event = APIGatewayProxyEventBuilder.make().withPathParameters({ uuid: customersGlobal[0].ExternalUuid }).withBody(payload).build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).errorMessage;
    expect(resultData).toBe('Missing fields: email, phone, street, city, state, zipCode');
  });

  it('Error - Should return a 400 error if the customer does not exist', async () => {
    const payload: PutCustomerRequestPayload = {
      firstName: 'Marcus',
      lastName: 'Aurelius',
      email: 'marcus.aurelius@example.com',
      phone: '0987654321',
      street: '123/Colosseum',
      city: 'Rome',
      state: 'ROM',
      zipCode: '00100',
      customerImageUrl: 'https://example.com/marcus.jpg',
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
