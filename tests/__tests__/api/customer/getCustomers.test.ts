import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { APIGatewayProxyEventBuilder } from '../../../builders/apiGatewayProxyEventBuilder.js';
import { knexClient } from '../../../../lib/utils/knexClient.js';
import type { TenantEntry } from '../../../../models/database/tenantEntry.js';
import { tenantTableName } from '../../../../repositories/tenantRepository.js';
import { TenantEntryBuilder } from '../../../builders/tenantEntryBuilder.js';
import { customerTableName } from '../../../../repositories/customerRepository.js';
import { CustomerEntryBuilder } from '../../../builders/customerEntryBuilder.js';
import { handler } from '../../../../lambdas/api/customer/getCustomers.js';

describe('API - Customers - GET', () => {
  const tenantsGlobal: TenantEntry[] = [];

  beforeAll(async () => {
    const tenant = await knexClient(tenantTableName)
      .insert([
        TenantEntryBuilder.make().withName('Tenant 1').build(),
        TenantEntryBuilder.make().withName('Tenant 2').build(),
        TenantEntryBuilder.make().withName('Tenant 3').build(),
      ])
      .returning('*');
    tenantsGlobal.push(...tenant);

    // Insert 9 customers
    const firstCustomers = await knexClient(customerTableName)
      .insert([
        CustomerEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withFirstName('John')
          .withLastName('Doe')
          .withEmail('john.doe@example.com')
          .withPhone('642103273577')
          .withStreet('101 Elm Street')
          .withCity('Wellington')
          .withState('Wellington Region')
          .withZipCode('6011')
          .withCustomerImageUrl('http/5678')
          .build(),

        CustomerEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withFirstName('Alice')
          .withLastName('Smith')
          .withEmail('alice.smith@example.com')
          .withPhone('642103273578')
          .withStreet('202 Oak Avenue')
          .withCity('Christchurch')
          .withState('Canterbury')
          .withZipCode('8013')
          .withCustomerImageUrl('http/9101')
          .build(),

        CustomerEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withFirstName('Bob')
          .withLastName('Johnson')
          .withEmail('bob.johnson@example.com')
          .withPhone('642103273579')
          .withStreet('303 Pine Lane')
          .withCity('Hamilton')
          .withState('Waikato')
          .withZipCode('3204')
          .withCustomerImageUrl('http/1121')
          .build(),

        CustomerEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withFirstName('Emma')
          .withLastName('Brown')
          .withEmail('emma.brown@example.com')
          .withPhone('642103273580')
          .withStreet('404 Maple Drive')
          .withCity('Dunedin')
          .withState('Otago')
          .withZipCode('9016')
          .withCustomerImageUrl('http/3141')
          .build(),

        CustomerEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withFirstName('Liam')
          .withLastName('Wilson')
          .withEmail('liam.wilson@example.com')
          .withPhone('642103273581')
          .withStreet('505 Birch Road')
          .withCity('Tauranga')
          .withState('Bay of Plenty')
          .withZipCode('3110')
          .withCustomerImageUrl('http/5161')
          .build(),

        CustomerEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withFirstName('Sophia')
          .withLastName('Taylor')
          .withEmail('sophia.taylor@example.com')
          .withPhone('642103273582')
          .withStreet('606 Cedar Street')
          .withCity('Napier')
          .withState("Hawke's Bay")
          .withZipCode('4110')
          .withCustomerImageUrl('http/7181')
          .build(),

        CustomerEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withFirstName('Noah')
          .withLastName('Anderson')
          .withEmail('noah.anderson@example.com')
          .withPhone('642103273583')
          .withStreet('707 Spruce Avenue')
          .withCity('Palmerston North')
          .withState('Manawatu-Wanganui')
          .withZipCode('4410')
          .withCustomerImageUrl('http/9202')
          .build(),

        CustomerEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withFirstName('Olivia')
          .withLastName('Martinez')
          .withEmail('olivia.martinez@example.com')
          .withPhone('642103273584')
          .withStreet('808 Willow Court')
          .withCity('Rotorua')
          .withState('Bay of Plenty')
          .withZipCode('3010')
          .withCustomerImageUrl('http/1223')
          .build(),

        CustomerEntryBuilder.make()
          .withTenantId(tenantsGlobal[0].Id)
          .withFirstName('Ethan')
          .withLastName('Clark')
          .withEmail('ethan.clark@example.com')
          .withPhone('642103273585')
          .withStreet('909 Aspen Way')
          .withCity('Invercargill')
          .withState('Southland')
          .withZipCode('9810')
          .withCustomerImageUrl('http/3245')
          .build(),
      ])
      .returning('Id');

    await knexClient(customerTableName)
      .insert([
        CustomerEntryBuilder.make()
          .withTenantId(tenantsGlobal[1].Id)
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
      .returning('Id');
  });

  it('Success - Should get customers with pagination', async () => {
    const event = APIGatewayProxyEventBuilder.make()
      .withQueryStringParameters({
        limit: '5',
        offset: '0',
        tenantId: tenantsGlobal[0].Id.toString(), // TODO: Remove once the tenant is pulled from the token
      })
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).data;
    expect(resultData.items).toBeDefined();
    expect(resultData.items.length).toBe(5);
    expect(resultData.total).toBe(9);
  });

  it('Success - Should get customers with pagination using offset', async () => {
    const event = APIGatewayProxyEventBuilder.make()
      .withQueryStringParameters({
        limit: '5',
        offset: '5',
        tenantId: tenantsGlobal[0].Id.toString(), // TODO: Remove once the tenant is pulled from the token
      })
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).data;
    expect(resultData.items).toBeDefined();
    expect(resultData.items.length).toBe(4); // Exclude the first 5 customers
    expect(resultData.total).toBe(9); // Total number of customers should still be 9
  });

  it('Success - Should return 0 customers if the tenant has no customers', async () => {
    const event = APIGatewayProxyEventBuilder.make()
      .withQueryStringParameters({
        limit: '5',
        offset: '0',
        tenantId: tenantsGlobal[2].Id.toString(), // TODO: Remove once the tenant is pulled from the token
      })
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(200);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).data;
    expect(resultData.items).toBeDefined();
    expect(resultData.items.length).toBe(0);
    expect(resultData.total).toBe(0);
  });

  it('Error - Should return a 400 error if the query parameters are missing', async () => {
    // Event missing the uuid path parameter
    const event = APIGatewayProxyEventBuilder.make().build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).message;
    expect(resultData).toContain('Missing required query parameters: limit, offset');
  });
});
