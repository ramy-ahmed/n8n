import {
	IExecuteFunctions,
} from 'n8n-core';

import {
	IDataObject,
	INodeTypeDescription,
	INodeExecutionData,
	INodeType,
} from 'n8n-workflow';

import {
	activeCampaignApiRequest,
	activeCampaignApiRequestAllItems,
	IProduct,
} from './GenericFunctions';

import {
	contactOperations,
	contactFields
} from './ContactDescription';

import {
	dealOperations,
	dealFields
} from './DealDescription';

import {
	ecomOrderOperations,
	ecomOrderFields
} from './EcomOrderDescription';

import {
	ecomCustomerOperations,
	ecomCustomerFields
} from './EcomCustomerDescription';

import {
	ecomOrderProductsOperations,
	ecomOrderProductsFields
} from './EcomOrderProductsDescription';

import {
	connectionOperations,
	connectionFields
} from './ConnectionDescription';

interface CustomProperty {
	name: string;
	value: string;
}


/**
 * Add the additional fields to the body
 *
 * @param {IDataObject} body The body object to add fields to
 * @param {IDataObject} additionalFields The fields to add
 */
function addAdditionalFields(body: IDataObject, additionalFields: IDataObject) {
	for (const key of Object.keys(additionalFields)) {
		if (key === 'customProperties' && (additionalFields.customProperties as IDataObject).property !== undefined) {
			for (const customProperty of (additionalFields.customProperties as IDataObject)!.property! as CustomProperty[]) {
				body[customProperty.name] = customProperty.value;
			}
		} else {
			body[key] = additionalFields[key];
		}
	}
}

export class ActiveCampaign implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ActiveCampaign',
		name: 'activeCampaign',
		icon: 'file:activeCampaign.png',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Create and edit data in ActiveCampaign',
		defaults: {
			name: 'ActiveCampaign',
			color: '#356ae6',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'activeCampaignApi',
				required: true,
			}
		],
		properties: [
			// ----------------------------------
			//         resources
			// ----------------------------------
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				options: [
					{
						name: 'Contact',
						value: 'contact',
					},
					{
						name: 'Deal',
						value: 'deal',
					},
					{
						name: 'Connection',
						value: 'connection'
					},
					{
						name: 'E-commerce Order',
						value: 'ecommerceOrder',
					},
					{
						name: 'E-Commerce Customer',
						value: 'ecommerceCustomer',
					},
					{
						name: 'E-commerce Order Products',
						value: 'ecommerceOrderProducts'
					}
				],
				default: 'contact',
				description: 'The resource to operate on.',
			},

			// ----------------------------------
			//         operations
			// ----------------------------------
			...contactOperations,
			...dealOperations,
			...connectionOperations,
			...ecomOrderOperations,
			...ecomCustomerOperations,
			...ecomOrderProductsOperations,

			// ----------------------------------
			//         fields
			// ----------------------------------
			// ----------------------------------
			//         contact
			// ----------------------------------
			...contactFields,

			// ----------------------------------
			//         deal
			// ----------------------------------
			...dealFields,

			// ----------------------------------
			//         connection
			// ----------------------------------
			...connectionFields,

			// ----------------------------------
			//         ecommerceOrder
			// ----------------------------------
			...ecomOrderFields,

			// ----------------------------------
			//         ecommerceCustomer
			// ----------------------------------
			...ecomCustomerFields,

			// ----------------------------------
			//         ecommerceOrderProducts
			// ----------------------------------
			...ecomOrderProductsFields,

		],
	};


	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: IDataObject[] = [];

		let resource: string;
		let operation: string;

		// For Post
		let body: IDataObject;
		// For Query string
		let qs: IDataObject;

		let requestMethod: string;
		let endpoint: string;
		let returnAll = false;
		let dataKey: string | undefined;

		for (let i = 0; i < items.length; i++) {
			dataKey = undefined;
			resource = this.getNodeParameter('resource', 0) as string;
			operation = this.getNodeParameter('operation', 0) as string;

			requestMethod = 'GET';
			endpoint = '';
			body = {} as IDataObject;
			qs = {} as IDataObject;

			if (resource === 'contact') {
				if (operation === 'create') {
					// ----------------------------------
					//         contact:create
					// ----------------------------------

					requestMethod = 'POST';

					const updateIfExists = this.getNodeParameter('updateIfExists', i) as boolean;
					if (updateIfExists === true) {
						endpoint = '/api/3/contact/sync';
					} else {
						endpoint = '/api/3/contacts';
					}

					dataKey = 'contact';

					body.contact = {
						email: this.getNodeParameter('email', i) as string,
					} as IDataObject;

					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
					addAdditionalFields(body.contact as IDataObject, additionalFields);

				} else if (operation === 'delete') {
					// ----------------------------------
					//         contact:delete
					// ----------------------------------

					requestMethod = 'DELETE';

					const contactId = this.getNodeParameter('contactId', i) as number;
					endpoint = `/api/3/contacts/${contactId}`;

				} else if (operation === 'get') {
					// ----------------------------------
					//         contact:get
					// ----------------------------------

					requestMethod = 'GET';

					const contactId = this.getNodeParameter('contactId', i) as number;
					endpoint = `/api/3/contacts/${contactId}`;

				} else if (operation === 'getAll') {
					// ----------------------------------
					//         contacts:getAll
					// ----------------------------------

					requestMethod = 'GET';

					returnAll = this.getNodeParameter('returnAll', i) as boolean;
					if (returnAll === false) {
						qs.limit = this.getNodeParameter('limit', i) as number;
					}

					dataKey = 'contacts';
					endpoint = `/api/3/contacts`;

				} else if (operation === 'update') {
					// ----------------------------------
					//         contact:update
					// ----------------------------------

					requestMethod = 'PUT';

					const contactId = this.getNodeParameter('contactId', i) as number;
					endpoint = `/api/3/contacts/${contactId}`;

					dataKey = 'contact';

					body.contact = {} as IDataObject;

					const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
					addAdditionalFields(body.contact as IDataObject, updateFields);

				} else {
					throw new Error(`The operation "${operation}" is not known`);
				}
			} else if (resource === 'deal') {
				if (operation === 'create') {
					// ----------------------------------
					//         deal:create
					// ----------------------------------

					requestMethod = 'POST';

					endpoint = '/api/3/deals';

					body.deal = {
						title: this.getNodeParameter('title', i) as string,
						contact: this.getNodeParameter('contact', i) as string,
						value: this.getNodeParameter('value', i) as number,
						currency: this.getNodeParameter('currency', i) as string,
					} as IDataObject;

					const group = this.getNodeParameter('group', i) as string;
					if (group !== '') {
						addAdditionalFields(body.deal as IDataObject, { group });
					}

					const owner = this.getNodeParameter('owner', i) as string;
					if (owner !== '') {
						addAdditionalFields(body.deal as IDataObject, { owner });
					}

					const stage = this.getNodeParameter('stage', i) as string;
					if (stage !== '') {
						addAdditionalFields(body.deal as IDataObject, { stage });
					}

					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
					addAdditionalFields(body.deal as IDataObject, additionalFields);

				} else if (operation === 'update') {
					// ----------------------------------
					//         deal:update
					// ----------------------------------

					requestMethod = 'PUT';

					const dealId = this.getNodeParameter('dealId', i) as number;
					endpoint = `/api/3/deals/${dealId}`;

					body.deal = {} as IDataObject;

					const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
					addAdditionalFields(body.deal as IDataObject, updateFields);

				} else if (operation === 'delete') {
					// ----------------------------------
					//         deal:delete
					// ----------------------------------

					requestMethod = 'DELETE';

					const dealId = this.getNodeParameter('dealId', i) as number;
					endpoint = `/api/3/deals/${dealId}`;

				} else if (operation === 'get') {
					// ----------------------------------
					//         deal:get
					// ----------------------------------

					requestMethod = 'GET';

					const dealId = this.getNodeParameter('dealId', i) as number;
					endpoint = `/api/3/deals/${dealId}`;

				} else if (operation === 'getAll') {
					// ----------------------------------
					//         deals:getAll
					// ----------------------------------

					requestMethod = 'GET';

					returnAll = this.getNodeParameter('returnAll', i) as boolean;
					if (returnAll === false) {
						qs.limit = this.getNodeParameter('limit', i) as number;
					}

					endpoint = `/api/3/deals`;

				} else if (operation === 'createNote') {
					// ----------------------------------
					//         deal:createNote
					// ----------------------------------
					requestMethod = 'POST';

					body.note = {
						note: this.getNodeParameter('dealNote', i) as string,
					} as IDataObject;

					const dealId = this.getNodeParameter('dealId', i) as number;
					endpoint = `/api/3/deals/${dealId}/notes`;

				} else if (operation === 'updateNote') {
					// ----------------------------------
					//         deal:updateNote
					// ----------------------------------
					requestMethod = 'PUT';

					body.note = {
						note: this.getNodeParameter('dealNote', i) as string,
					} as IDataObject;

					const dealId = this.getNodeParameter('dealId', i) as number;
					const dealNoteId = this.getNodeParameter('dealNoteId', i) as number;
					endpoint = `/api/3/deals/${dealId}/notes/${dealNoteId}`;

				} else {
					throw new Error(`The operation "${operation}" is not known`);
				}
			} else if (resource === 'connection') {
				if (operation === 'create') {
					// ----------------------------------
					//         connection:create
					// ----------------------------------

					requestMethod = 'POST';

					endpoint = '/api/3/connections';

					body.connection = {
						service: this.getNodeParameter('service', i) as string,
						externalid: this.getNodeParameter('externalid', i) as string,
						name: this.getNodeParameter('name', i) as string,
						logoUrl: this.getNodeParameter('logoUrl', i) as string,
						linkUrl: this.getNodeParameter('linkUrl', i) as string,
					} as IDataObject;

				} else if (operation === 'update') {
					// ----------------------------------
					//         connection:update
					// ----------------------------------

					requestMethod = 'PUT';

					const connectionId = this.getNodeParameter('connectionId', i) as number;
					endpoint = `/api/3/connections/${connectionId}`;

					body.connection = {} as IDataObject;

					const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
					addAdditionalFields(body.connection as IDataObject, updateFields);

				} else if (operation === 'delete') {
					// ----------------------------------
					//         connection:delete
					// ----------------------------------

					requestMethod = 'DELETE';

					const connectionId = this.getNodeParameter('connectionId', i) as number;
					endpoint = `/api/3/connections/${connectionId}`;

				} else if (operation === 'get') {
					// ----------------------------------
					//         connection:get
					// ----------------------------------

					requestMethod = 'GET';

					const connectionId = this.getNodeParameter('connectionId', i) as number;
					endpoint = `/api/3/connections/${connectionId}`;

				} else if (operation === 'getAll') {
					// ----------------------------------
					//         connections:getAll
					// ----------------------------------

					requestMethod = 'GET';

					returnAll = this.getNodeParameter('returnAll', i) as boolean;
					if (returnAll === false) {
						qs.limit = this.getNodeParameter('limit', i) as number;
					}

					endpoint = `/api/3/connections`;

				} else {
					throw new Error(`The operation "${operation}" is not known`);
				}
			} else if (resource === 'ecommerceOrder') {
				if (operation === 'create') {
					// ----------------------------------
					//         ecommerceOrder:create
					// ----------------------------------

					requestMethod = 'POST';

					endpoint = '/api/3/ecomOrders';

					body.ecomOrder = {
						source: this.getNodeParameter('source', i) as string,
						email: this.getNodeParameter('email', i) as string,
						totalPrice: this.getNodeParameter('totalPrice', i) as number,
						currency: this.getNodeParameter('currency', i).toString().toUpperCase() as string,
						externalCreatedDate: this.getNodeParameter('externalCreatedDate', i) as string,
						connectionid: this.getNodeParameter('connectionid', i) as number,
						customerid: this.getNodeParameter('customerid', i) as number,
					} as IDataObject;

					const externalid = this.getNodeParameter('externalid', i) as string;
					if (externalid !== '') {
						addAdditionalFields(body.ecomOrder as IDataObject, { externalid });
					}

					const externalcheckoutid = this.getNodeParameter('externalcheckoutid', i) as string;
					if (externalcheckoutid !== '') {
						addAdditionalFields(body.ecomOrder as IDataObject, { externalcheckoutid });
					}

					const abandonedDate = this.getNodeParameter('abandonedDate', i) as string;
					if (abandonedDate !== '') {
						addAdditionalFields(body.ecomOrder as IDataObject, { abandonedDate });
					}

					const orderProducts = this.getNodeParameter('orderProducts', i) as unknown as IProduct[];
					addAdditionalFields(body.ecomOrder as IDataObject, { orderProducts });

					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
					addAdditionalFields(body.ecomOrder as IDataObject, additionalFields);

				} else if (operation === 'update') {
					// ----------------------------------
					//         ecommerceOrder:update
					// ----------------------------------

					requestMethod = 'PUT';

					const orderId = this.getNodeParameter('orderId', i) as number;
					endpoint = `/api/3/ecomOrders/${orderId}`;

					body.ecomOrder = {} as IDataObject;

					const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
					addAdditionalFields(body.ecomOrder as IDataObject, updateFields);

				} else if (operation === 'delete') {
					// ----------------------------------
					//         ecommerceOrder:delete
					// ----------------------------------

					requestMethod = 'DELETE';

					const orderId = this.getNodeParameter('orderId', i) as number;
					endpoint = `/api/3/ecomOrders/${orderId}`;

				} else if (operation === 'get') {
					// ----------------------------------
					//         ecommerceOrder:get
					// ----------------------------------

					requestMethod = 'GET';

					const orderId = this.getNodeParameter('orderId', i) as number;
					endpoint = `/api/3/ecomOrders/${orderId}`;

				} else if (operation === 'getAll') {
					// ----------------------------------
					//         ecommerceOrders:getAll
					// ----------------------------------

					requestMethod = 'GET';

					returnAll = this.getNodeParameter('returnAll', i) as boolean;
					if (returnAll === false) {
						qs.limit = this.getNodeParameter('limit', i) as number;
					}

					endpoint = `/api/3/ecomOrders`;

				} else {
					throw new Error(`The operation "${operation}" is not known`);
				}
			} else if (resource === 'ecommerceCustomer') {
				if (operation === 'create') {
					// ----------------------------------
					//         ecommerceCustomer:create
					// ----------------------------------

					requestMethod = 'POST';

					endpoint = '/api/3/ecomCustomers';

					body.ecomCustomer = {
						connectionid: this.getNodeParameter('connectionid', i) as string,
						externalid: this.getNodeParameter('externalid', i) as string,
						email: this.getNodeParameter('email', i) as string,
					} as IDataObject;

					const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;
					if (additionalFields.acceptsMarketing !== undefined) {
						if (additionalFields.acceptsMarketing === true) {
							additionalFields.acceptsMarketing = '1';
						} else {
							additionalFields.acceptsMarketing = '0';
						}
					}
					addAdditionalFields(body.ecomCustomer as IDataObject, additionalFields);

				} else if (operation === 'update') {
					// ----------------------------------
					//         ecommerceCustomer:update
					// ----------------------------------

					requestMethod = 'PUT';

					const ecommerceCustomerId = this.getNodeParameter('ecommerceCustomerId', i) as number;
					endpoint = `/api/3/ecomCustomers/${ecommerceCustomerId}`;

					body.ecomCustomer = {} as IDataObject;

					const updateFields = this.getNodeParameter('updateFields', i) as IDataObject;
					if (updateFields.acceptsMarketing !== undefined) {
						if (updateFields.acceptsMarketing === true) {
							updateFields.acceptsMarketing = '1';
						} else {
							updateFields.acceptsMarketing = '0';
						}
					}
					addAdditionalFields(body.ecomCustomer as IDataObject, updateFields);

				} else if (operation === 'delete') {
					// ----------------------------------
					//         ecommerceCustomer:delete
					// ----------------------------------

					requestMethod = 'DELETE';

					const ecommerceCustomerId = this.getNodeParameter('ecommerceCustomerId', i) as number;
					endpoint = `/api/3/ecomCustomers/${ecommerceCustomerId}`;

				} else if (operation === 'get') {
					// ----------------------------------
					//         ecommerceCustomer:get
					// ----------------------------------

					requestMethod = 'GET';

					const ecommerceCustomerId = this.getNodeParameter('ecommerceCustomerId', i) as number;
					endpoint = `/api/3/ecomCustomers/${ecommerceCustomerId}`;

				} else if (operation === 'getAll') {
					// ----------------------------------
					//         ecommerceCustomers:getAll
					// ----------------------------------

					requestMethod = 'GET';

					returnAll = this.getNodeParameter('returnAll', i) as boolean;
					if (returnAll === false) {
						qs.limit = this.getNodeParameter('limit', i) as number;
					}

					endpoint = `/api/3/ecomCustomers`;

				} else {
					throw new Error(`The operation "${operation}" is not known`);
				}
			} else if (resource === 'ecommerceOrderProducts') {
				if (operation === 'getByProductId') {
					// ----------------------------------
					//         ecommerceOrderProducts:getByProductId
					// ----------------------------------

					requestMethod = 'GET';

					const procuctId = this.getNodeParameter('procuctId', i) as number;
					endpoint = `/api/3/ecomOrderProducts/${procuctId}`;


				} else if (operation === 'getByOrderId') {
					// ----------------------------------
					//         ecommerceOrderProducts:getByOrderId
					// ----------------------------------

					requestMethod = 'GET';

					const orderId = this.getNodeParameter('orderId', i) as number;
					endpoint = `/api/3/ecomOrders/${orderId}/orderProducts`;

				} else if (operation === 'getAll') {
					// ----------------------------------
					//         ecommerceOrderProductss:getAll
					// ----------------------------------

					requestMethod = 'GET';

					returnAll = this.getNodeParameter('returnAll', i) as boolean;
					if (returnAll === false) {
						qs.limit = this.getNodeParameter('limit', i) as number;
					}

					endpoint = `/api/3/ecomOrderProducts`;

				} else {
					throw new Error(`The operation "${operation}" is not known`);
				}

			} else {
				throw new Error(`The resource "${resource}" is not known!`);
			}

			let responseData;
			if (returnAll === true) {
				responseData = await activeCampaignApiRequestAllItems.call(this, requestMethod, endpoint, body, qs, dataKey);
			} else {
				responseData = await activeCampaignApiRequest.call(this, requestMethod, endpoint, body, qs, dataKey);
			}

			if (Array.isArray(responseData)) {
				returnData.push.apply(returnData, responseData as IDataObject[]);
			} else {
				returnData.push(responseData as IDataObject);
			}
		}

		return [this.helpers.returnJsonArray(returnData)];
	}
}