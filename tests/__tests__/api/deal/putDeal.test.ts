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
    customersGlobal = [];
    dealsGlobal = [];

    // const tenant = await knexClient(tenantTableName).insert(TenantEntryBuilder.make().withName('Tenant 1').build()).returning('*');

    // Populate customersGlobal with a mock customer entry
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
          .withZipCode('62701')
          .withCustomerImageUrl('https://example.com/customer.jpg')
          .build(),
      )
      .returning(['Id', 'ExternalUuid', 'FirstName', 'LastName', 'Email', 'Phone', 'Street', 'City', 'State', 'ZipCode', 'CustomerImageUrl']);

    customersGlobal.push(...customer);

    const deal = await knexClient(dealTableName)
      .insert(
        DealEntryBuilder.make()
          .withCustomerId(customersGlobal[0].ExternalUuid)
          .withStreet('123 Main St')
          .withCity('Springfield')
          .withState('IL')
          .withZipCode('62701')
          .withRoomArea('1000')
          .withPrice('100000')
          .withNumberOfPeople('2')
          .withAppointmentDate(new Date().toISOString())
          .withProgress(DealProgress.InProgress)
          .withSpecialInstructions('Special instructions')
          .withRoomAccess(RoomAccess.KeysWithDoorman)
          .withDealImageUrl('https://example.com/deal.jpg')

          .build(),
      )
      .returning([
        'Id',
        'ExternalUuid',
        'TenantId',
        'CustomerId',
        'DealImageUrl',
        'Street',
        'City',
        'State',
        'ZipCode',
        'RoomArea',
        'Price',
        'NumberOfPeople',
        'AppointmentDate',
        'Progress',
        'SpecialInstructions',
        'RoomAccess',
      ]);

    dealsGlobal.push(...deal);
  });

  it('Success - Should update a deal', async () => {
    const payload: PutDealRequestPayload = {
      customerUuid: customersGlobal[0].ExternalUuid,
      street: dealsGlobal[0].Street,
      city: dealsGlobal[0].City,
      state: dealsGlobal[0].State,
      zipCode: dealsGlobal[0].ZipCode,
      roomArea: String(dealsGlobal[0].RoomArea),
      price: dealsGlobal[0].Price,
      numberOfPeople: String(dealsGlobal[0].NumberOfPeople),
      appointmentDate: dealsGlobal[0].AppointmentDate,
      progress: DealProgress.InProgress,
      specialInstructions: String(dealsGlobal[0].SpecialInstructions),
      roomAccess: RoomAccess.KeysWithDoorman,
      dealImageUrl: String(dealsGlobal[0].DealImageUrl),
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
    expect(resultData.customerUuid).toBe(payload.customerUuid);
    expect(resultData.street).toBe(payload.street);
    expect(resultData.city).toBe(payload.city);
    expect(resultData.state).toBe(payload.state);
    expect(resultData.zipCode).toBe(payload.zipCode);
    expect(resultData.roomArea).toBe(payload.roomArea);
    expect(resultData.price).toBe(payload.price);
    expect(resultData.numberOfPeople).toBe(payload.numberOfPeople);
    expect(resultData.appointmentDate).toBe(payload.appointmentDate);
    expect(resultData.progress).toBe(payload.progress);
    expect(resultData.specialInstructions).toBe(payload.specialInstructions);
    expect(resultData.roomAccess).toBe(payload.roomAccess);
    expect(resultData.dealImageUrl).toBe(payload.dealImageUrl);
    expect(resultData.uuid).toBeDefined();
    expect(resultData.createdOn).toBeDefined();
    expect(resultData.modifiedOn).toBeDefined();

    // Validate the database record
    const deal = await selectDealByExternalUuid(resultData.uuid);
    expect(deal).toBeDefined();
    expect(deal!.CustomerId).toBe(payload.customerUuid);
    expect(deal!.Street).toBe(payload.street);
    expect(deal!.City).toBe(payload.city);
    expect(deal!.State).toBe(payload.state);
    expect(deal!.ZipCode).toBe(payload.zipCode);
    expect(deal!.Price).toBe(payload.price);
    expect(deal!.AppointmentDate).toBe(payload.appointmentDate);
    expect(deal!.Progress).toBe(payload.progress);
    expect(deal!.SpecialInstructions).toBe(payload.specialInstructions);
    expect(deal!.RoomAccess).toBe(payload.roomAccess);
    expect(deal!.DealImageUrl).toBe(payload.dealImageUrl);
  });

  it('Error - Should return a 400 error if the path parameter is missing', async () => {
    const payload: Partial<PutDealRequestPayload> = {
      customerUuid: customersGlobal[0].ExternalUuid,
      street: dealsGlobal[0].Street,
      city: dealsGlobal[0].City,
      state: dealsGlobal[0].State,
      zipCode: dealsGlobal[0].ZipCode,
      roomArea: String(dealsGlobal[0].RoomArea),
      price: dealsGlobal[0].Price,
      numberOfPeople: String(dealsGlobal[0].NumberOfPeople),
      appointmentDate: dealsGlobal[0].AppointmentDate,
      progress: DealProgress.InProgress,
      specialInstructions: String(dealsGlobal[0].SpecialInstructions),
      roomAccess: RoomAccess.KeysWithDoorman,
      dealImageUrl: String(dealsGlobal[0].DealImageUrl),
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
    // Payload missing the street and city
    const payload: Partial<PutDealRequestPayload> = {
      state: dealsGlobal[0].State,
      zipCode: dealsGlobal[0].ZipCode,
      price: String(dealsGlobal[0].Price),
      appointmentDate: dealsGlobal[0].AppointmentDate,
      progress: DealProgress.InProgress,
      roomAccess: RoomAccess.KeysWithDoorman,
      dealImageUrl: String(dealsGlobal[0].DealImageUrl),
      customerUuid: customersGlobal[0].ExternalUuid,
    };

    // Event missing the uuid path parameter
    const event = APIGatewayProxyEventBuilder.make().withPathParameters(payload).withBody(payload).build();

    // Run the handler
    const res = (await handler(event)) as APIGatewayProxyStructuredResultV2;

    // Validate the API response
    expect(res.statusCode).toBe(400);
    expect(res.body).toBeDefined();

    const resultData = JSON.parse(res.body!).errorMessage;
    expect(resultData).toBe('Missing fields: street, city');
  });

  it('Error - Should return a 400 error if the usecustomer does not exist', async () => {
    const payload: PutDealRequestPayload = {
      customerUuid: customersGlobal[0].ExternalUuid,
      street: '456 Elm St',
      city: 'Springfield',
      state: 'IL',
      zipCode: '62701',
      roomArea: '1000',
      price: '100000',
      numberOfPeople: '2',
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

    const resultData = JSON.parse(res.body!).errorMessage;
    expect(resultData).toBe('Deal not found');
  });
});
