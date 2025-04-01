import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { knexClient } from '../../../../lib/utils/knexClient.js';
import { randomUUID } from 'crypto';
import type { CustomerEntry } from '../../../../models/database/customerEntry.js';
import { customerTableName } from '../../../../repositories/customerRepository.js';
import { CustomerEntryBuilder } from '../../../builders/customerEntryBuilder.js';
import { DealProgress, RoomAccess, type DealEntry } from '../../../../models/database/dealEntry.js';
import { dealTableName, selectDealByExternalUuid } from '../../../../repositories/dealRepository.js';
import { DealEntryBuilder } from '../../../builders/dealEntryBuilder.js';
import type { PutDealRequestPayload } from '../../../../models/api/payloads/deal.js';
import { APIGatewayProxyEventBuilder } from '../../../builders/apiGatewayProxyEventBuilder.js';
import { handler } from '../../../../lambdas/api/deal/putDeal.js';
import type { TenantEntry } from '../../../../models/database/tenantEntry.js';
import { tenantTableName } from '../../../../repositories/tenantRepository.js';
import { TenantEntryBuilder } from '../../../builders/tenantEntryBuilder.js';

describe('API - Deal - PUT', () => {
  const tenantsGlobal: TenantEntry[] = [];
  let customersGlobal: CustomerEntry[] = [];
  let dealsGlobal: DealEntry[] = [];

  beforeEach(async () => {
    const tenant = await knexClient(tenantTableName).insert(TenantEntryBuilder.make().withName('Tenant 1').build()).returning('*');
    tenantsGlobal.push(...tenant);

    const customer = await knexClient(customerTableName)
      .insert(
        CustomerEntryBuilder.make()
          .withTenantId(tenant[0].Id)
          .withFirstName('John')
          .withLastName('Doe')
          .withEmail('john.doe@example.com')
          .withPhone('123-456-7890')
          .withStreet('123 Main St')
          .withCity('Springfield')
          .withState('IL')
          .withZipCode('62701')
          .withCustomerImageUrl('https://example.com/customer.jpg')
          .build(),
      )
      .returning('*');

    customersGlobal.push(...customer);

    const deal = await knexClient(dealTableName)
      .insert(
        DealEntryBuilder.make()
          .withTenantId(tenant[0].Id)
          .withCustomerId(customersGlobal[0].Id)
          .withStreet('123 Main St')
          .withCity('Springfield')
          .withState('IL')
          .withZipCode('62701')
          .withRoomArea(1000)
          .withPrice(100000)
          .withNumberOfPeople(2)
          .withAppointmentDate(new Date().toISOString())
          .withProgress(DealProgress.InProgress)
          .withSpecialInstructions('Special instructions')
          .withRoomAccess(RoomAccess.KeysWithDoorman)
          .withDealImageUrl('https://example.com/deal.jpg')
          .build(),
      )
      .returning('*');

    dealsGlobal.push(...deal);
  });

  it('Success - Should update a deal', async () => {
    const payload: PutDealRequestPayload = {
      street: 'New Street Name',
      city: dealsGlobal[0].City,
      state: dealsGlobal[0].State,
      zipCode: dealsGlobal[0].ZipCode,
      roomArea: dealsGlobal[0].RoomArea,
      price: dealsGlobal[0].Price,
      numberOfPeople: dealsGlobal[0].NumberOfPeople,
      appointmentDate: dealsGlobal[0].AppointmentDate,
      progress: dealsGlobal[0].Progress,
      specialInstructions: dealsGlobal[0].SpecialInstructions,
      roomAccess: dealsGlobal[0].RoomAccess,
      dealImageUrl: dealsGlobal[0].ImageUrl,
    };

    const event = APIGatewayProxyEventBuilder.make()
      .withPathParameters({
        uuid: dealsGlobal[0].ExternalUuid,
      })
      .withBody(payload)
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(201);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).data;
    expect(resultData.customer.uuid).toBe(customersGlobal[0].ExternalUuid);
    expect(resultData.customer.customerImageUrl).toBe(customersGlobal[0].ImageUrl);
    expect(resultData.customer.firstName).toBe(customersGlobal[0].FirstName);
    expect(resultData.customer.lastName).toBe(customersGlobal[0].LastName);
    expect(resultData.customer.email).toBe(customersGlobal[0].Email);
    expect(resultData.customer.phone).toBe(customersGlobal[0].Phone);
    expect(resultData.street).toBe('New Street Name');
    expect(resultData.city).toBe(payload.city);
    expect(resultData.state).toBe(payload.state);
    expect(resultData.zipCode).toBe(payload.zipCode);
    expect(resultData.roomArea).toBe(payload.roomArea);
    expect(resultData.price).toBe(payload.price);
    expect(resultData.numberOfPeople).toBe(payload.numberOfPeople);
    expect(new Date(resultData.appointmentDate).getTime()).toBeCloseTo(new Date(dealsGlobal[0].AppointmentDate).getTime());
    expect(resultData.progress).toBe(payload.progress);
    expect(resultData.specialInstructions).toBe(payload.specialInstructions);
    expect(resultData.roomAccess).toBe(payload.roomAccess);
    expect(resultData.dealImageUrl).toBe(payload.dealImageUrl);
    expect(resultData.uuid).toBeDefined();
    expect(resultData.createdOn).toBeDefined();
    expect(resultData.modifiedOn).toBeDefined();

    // Validate the database record (filds was changed)
    const deal = await selectDealByExternalUuid(resultData.uuid);
    expect(deal).toBeDefined();
    expect(deal!.Street).toBe(payload.street);
  });

  it('Error - Should return a 400 error if the path parameter is missing', async () => {
    const payload: Partial<PutDealRequestPayload> = {
      street: 'New Street Name',
      city: dealsGlobal[0].City,
      state: dealsGlobal[0].State,
      zipCode: dealsGlobal[0].ZipCode,
      roomArea: dealsGlobal[0].RoomArea,
      price: dealsGlobal[0].Price,
      numberOfPeople: dealsGlobal[0].NumberOfPeople,
      appointmentDate: dealsGlobal[0].AppointmentDate,
      progress: DealProgress.InProgress,
      specialInstructions: dealsGlobal[0].SpecialInstructions,
      roomAccess: RoomAccess.KeysWithDoorman,
      dealImageUrl: dealsGlobal[0].ImageUrl,
    };

    // Event missing the uuid path parameter
    const event = APIGatewayProxyEventBuilder.make().withBody(payload).build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).message;
    expect(resultData).toBe('Missing path parameters: uuid');
  });

  it('Error - Should return a 400 error if the body is missing required fields', async () => {
    // Payload missing the street and city
    const payload: Partial<PutDealRequestPayload> = {
      city: dealsGlobal[0].City,
      state: dealsGlobal[0].State,
      zipCode: dealsGlobal[0].ZipCode,
      price: dealsGlobal[0].Price,
      appointmentDate: dealsGlobal[0].AppointmentDate,
      progress: DealProgress.InProgress,
      roomAccess: RoomAccess.KeysWithDoorman,
      dealImageUrl: dealsGlobal[0].ImageUrl,
    };

    // Event missing the uuid path parameter
    const event = APIGatewayProxyEventBuilder.make()
      .withPathParameters({
        uuid: dealsGlobal[0].ExternalUuid,
      })
      .withBody(payload)
      .build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).message;
    expect(resultData).toBe('Missing fields: street, roomArea, numberOfPeople');
  });

  it('Error - Should return a 400 error if the deal does not exist', async () => {
    const payload: PutDealRequestPayload = {
      street: '456 Elm St',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
      roomArea: 1000,
      price: 100000,
      numberOfPeople: 2,
      appointmentDate: new Date().toISOString(),
      progress: DealProgress.InProgress,
      specialInstructions: 'Special instructions',
      roomAccess: RoomAccess.KeysWithDoorman,
      dealImageUrl: 'https://example.com/deal.jpg',
    };

    // Event missing the uuid path parameter
    const event = APIGatewayProxyEventBuilder.make().withPathParameters({ uuid: randomUUID() }).withBody(payload).build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).message;
    expect(resultData).toBe('Deal not found');
  });
});
