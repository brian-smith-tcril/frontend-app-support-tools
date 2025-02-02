import { camelCaseObject } from '@edx/frontend-platform';
import {
  createCatalogs,
  lmsCustomerCatalog,
  selectProvisioningContext,
  sortedCatalogQueries,
  hasValidPolicyAndSubidy,
  getCamelCasedConfigAttribute,
  extractDefinedCatalogTitle,
  normalizeSubsidyDataTableData,
  filterIndexOfCatalogQueryTitle,
  createSubsidy,
  createPolicy,
  determineInvalidFields,
  transformPolicyData,
} from '../utils';
import {
  sampleCatalogQueries,
  sampleDataTableData,
  sampleMultiplePolicyFormData,
  sampleSinglePolicyCustomCatalogQueryFormData,
  sampleSinglePolicyPredefinedCatalogQueryFormData,
} from '../../../testData/constants';
import { USES_LOCAL_TEST_DATA } from '../constants';

describe('selectProvisioningContext', () => {
  it('throws an error when no arguments are passed', () => {
    expect(() => selectProvisioningContext()).toThrow();
  });
});

describe('sortedCatalogQueries', () => {
  it('sorts catalog queries by last modified date (newest first)', () => {
    const sortedQueries = sortedCatalogQueries(sampleCatalogQueries.data);
    for (let i = 0; i < sortedQueries.length - 1; i++) {
      expect(sortedQueries[i].title).toEqual(`TestQ${sortedQueries.length - i}`);
      expect(sortedQueries[i].modified < sortedQueries[i + 1]).toBeTruthy();
    }
  });
  it('returns the object array in the same order if no modified date fields', () => {
    const testObject = [{
      id: 1,
    },
    {
      id: 2,
    }];

    const testObjectSort = sortedCatalogQueries(testObject);
    expect(testObjectSort).toEqual(testObject);
  });
});

describe('lmsCustomerCatalog', () => {
  it('queryBy returns the correct url', () => {
    expect(lmsCustomerCatalog.queryBy('testtest')).toEqual('/admin/enterprise/enterprisecustomercatalog/?q=testtes');
  });
  it('queryBy returns the correct url', () => {
    expect(lmsCustomerCatalog.queryBy()).toEqual('/admin/enterprise/enterprisecustomercatalog/');
  });
});

describe('hasValidPolicyAndSubidy', () => {
  const formDataUseCases = [
    sampleMultiplePolicyFormData,
    sampleSinglePolicyCustomCatalogQueryFormData,
    sampleSinglePolicyPredefinedCatalogQueryFormData,
  ];
  it('returns true if all required fields are filled out', () => {
    formDataUseCases.forEach((formData) => {
      expect(hasValidPolicyAndSubidy(formData)).toBeTruthy();
    });
  });
});

describe('getCamelCasedConfigAttribute', () => {
  const PREDEFINED_CATALOG_QUERIES = {
    everything: 1,
    open_courses: 2,
    executive_education: 3,
  };
  it('returns the correct camelCased attribute', () => {
    expect(getCamelCasedConfigAttribute('PREDEFINED_CATALOG_QUERIES')).toEqual(camelCaseObject(PREDEFINED_CATALOG_QUERIES));
  });
  it('returns null if no attribute is passed', () => {
    expect(getCamelCasedConfigAttribute()).toEqual(null);
  });
  it('returns null if attribute is passed but no configuration exist', () => {
    expect(getCamelCasedConfigAttribute('PIKACHU_FEATURE_FLAG')).toEqual(null);
  });
});

describe('extractDefinedCatalogTitle', () => {
  it('returns the correct title', () => {
    expect(extractDefinedCatalogTitle({ catalogQueryTitle: 'The Bestests budget' })).toEqual('The Bestests');
  });
  it('returns null if policy does not container ` budget`', () => {
    expect(extractDefinedCatalogTitle({ catalogQueryTitle: 'The Bestests' })).toEqual('');
  });
  it('returns null if no policy is passed', () => {
    expect(extractDefinedCatalogTitle({})).toEqual(null);
  });
  it('returns catalog query title', () => {
    expect(extractDefinedCatalogTitle({ catalogQueryMetadata: { catalogQuery: { title: 'The Bestests' } } })).toEqual('The Bestests');
  });
});

describe('normalizeSubsidyDataTableData', () => {
  const fetchedData = camelCaseObject(sampleDataTableData(10));
  const redirectURL = jest.fn();
  const actionIcon = jest.fn();
  it('returns the correct data', () => {
    const normalizedData = normalizeSubsidyDataTableData({ fetchedData, actionIcon, redirectURL });
    fetchedData.forEach((item, index) => {
      expect(normalizedData[index].enterpriseCustomerUuid).toEqual(item.enterpriseCustomerUuid);
      const convertedActiveDateTime = new Date(item.activeDatetime).toLocaleDateString().replace(/\//g, '-');
      const convertedExpirationDateTime = new Date(item.expirationDatetime).toLocaleDateString().replace(/\//g, '-');
      expect(normalizedData[index].activeDatetime).toEqual(convertedActiveDateTime);
      expect(normalizedData[index].expirationDatetime).toEqual(convertedExpirationDateTime);
    });
  });
});

describe('USES_LOCAL_TEST_DATA', () => {
  it('should be false so testing state does not get sent to prod', () => {
    expect(USES_LOCAL_TEST_DATA).toEqual(false);
  });
});

describe('filterIndexOfCatalogQuery', () => {
  it('filters correctly', () => {
    const sampleFilterBy = '[SPLIT][HERE]';
    const modifedSampleCatalogQueries = sampleCatalogQueries.data.map((query, index) => ({
      ...query,
      title: index % 2 ? `${sampleFilterBy} ${query.title}` : query.title,
    }));
    const modifiedFilteredByResponse = sampleCatalogQueries.data
      .map((query, index) => (!(index % 2) ? query : false))
      .filter((query) => query !== false);
    expect(filterIndexOfCatalogQueryTitle(
      modifedSampleCatalogQueries,
      sampleFilterBy,
    )).toEqual(modifiedFilteredByResponse);
  });
  it('returns the original array if no filter is passed', () => {
    expect(filterIndexOfCatalogQueryTitle(sampleCatalogQueries.data)).toEqual(sampleCatalogQueries.data);
  });
});

const sampleResponses = {
  data: {
    createCatalog: {
      uuid: 'abf9f43b-1872-4c26-a2e6-1598fc57fbdd',
      title: 'test123',
      enterprise_customer: 'c6aaf182-bcae-4d14-84cd-d538b7ec08f0',
      enterprise_catalog_query: 10,
    },
    createSubsidy: {
      uuid: '205f11a4-0303-4407-a2e7-80261ef8fb8f',
      title: '321',
      enterprise_customer_uuid: 'a929e999-2487-4a53-9741-92e0d2022598',
      active_datetime: '2023-05-09T00:00:00Z',
      expiration_datetime: '2023-06-02T00:00:00Z',
      unit: 'usd_cents',
      reference_id: '112211',
      reference_type: 'salesforce_opportunity_line_item',
      current_balance: 1200,
      starting_balance: 1200,
      internal_only: true,
      revenue_category: 'partner-no-rev-prepay',
    },
    createPolicy: {
      uuid: '7a5e4882-16a6-4a5f-bfe1-eda91014aff4',
      policy_type: 'PerLearnerSpendCreditAccessPolicy',
      description: 'This policy created for subsidy 205f11a4-0303-4407-a2e7-80261ef8fb8f with 1 associated policies',
      active: true,
      enterprise_customer_uuid: 'a929e999-2487-4a53-9741-92e0d2022598',
      catalog_uuid: '2afb0a7f-103d-43c3-8b1a-db8c5b3ba1f4',
      subsidy_uuid: '205f11a4-0303-4407-a2e7-80261ef8fb8f',
      access_method: 'direct',
      per_learner_enrollment_limit: null,
      per_learner_spend_limit: null,
      spend_limit: 1200,
    },
  },
};

jest.mock('@edx/frontend-platform/auth', () => ({
  getAuthenticatedHttpClient: () => ({
    get: () => Promise.resolve({
      data: [{
        id: '1',
      }, {
        id: '2',
      }],
    }),
    post: () => Promise.resolve(sampleResponses),
  }),
}));

describe('createCatalogs', () => {
  it('returns the correct data', async () => {
    const data = await createCatalogs([
      'abf9f43b-1872-4c26-a2e6-1598fc57fbdd',
      10,
      'abf9f43b-1872-4c26-a2e6-1598fc57fbdd - test123',
    ]);
    expect(data.createCatalog).toEqual(sampleResponses.data.createCatalog);
  });
});

describe('createSubsidy', () => {
  it('returns the correct data', async () => {
    const data = await createSubsidy({
      reference_id: '112211',
      default_title: '321',
      default_enterprise_customer_uuid: 'a929e999-2487-4a53-9741-92e0d2022598',
      default_active_datetime: '2023-05-09T00:00:00.000Z',
      default_expiration_datetime: '2023-06-02T00:00:00.000Z',
      default_unit: 'usd_cents',
      default_starting_balance: 1200,
      default_revenue_category: 'partner-no-rev-prepay',
      default_internal_only: true,
    });
    expect(data.createSubsidy).toEqual(sampleResponses.data.createSubsidy);
  });
});

describe('createPolicies', () => {
  it('returns the correct data', async () => {
    const { data } = await createPolicy({
      policy_type: 'PerLearnerSpendCreditAccessPolicy',
      description: 'This policy created for subsidy 205f11a4-0303-4407-a2e7-80261ef8fb8f with 1 associated policies',
      active: true,
      enterprise_customer_uuid: 'a929e999-2487-4a53-9741-92e0d2022598',
      catalog_uuid: '2afb0a7f-103d-43c3-8b1a-db8c5b3ba1f4',
      subsidy_uuid: '205f11a4-0303-4407-a2e7-80261ef8fb8f',
      access_method: 'direct',
      per_learner_spend_limit: null,
      per_learner_enrollment_limit: null,
      spend_limit: 1200,
    });
    expect(data.createPolicy).toEqual(sampleResponses.data.createPolicy);
  });
});

const emptyDataSet = {
  policies: [],
  subsidyTitle: '',
  enterpriseUUID: 'abc',
  financialIdentifier: '',
  startDate: '',
  endDate: '',
  subsidyRevReq: '',
};
describe('determineInvalidFields', () => {
  it('returns false for all subsidy fields', async () => {
    const expectedFailedSubsidyOutput = {
      subsidyTitle: false,
      enterpriseUUID: false,
      financialIdentifier: false,
      startDate: false,
      endDate: false,
      subsidyRevReq: false,
      multipleFunds: false,
    };
    const output = await determineInvalidFields(emptyDataSet);
    expect(output).toEqual([expectedFailedSubsidyOutput]);
  });
  it('returns false for all policy fields', async () => {
    const expectedFailedPolicyOutput = [{
      subsidyTitle: false,
      enterpriseUUID: false,
      financialIdentifier: false,
      startDate: false,
      endDate: false,
      subsidyRevReq: false,
      multipleFunds: true,
    }, [{
      accountName: false,
      accountValue: false,
      catalogQueryMetadata: false,
      perLearnerCap: false,
      perLearnerCapAmount: false,
    }]];
    const emptyPolicyDataset = {
      ...emptyDataSet,
      multipleFunds: true,
      policies: [{
        accountName: '',
        accountValue: '',
        catalogQueryMetadata: {
          catakigQuery: {
            id: '',
          },
        },
        perLearnerCap: undefined,
        perLearnerCapAmount: null,
      }],
    };
    const output = await determineInvalidFields(emptyPolicyDataset);
    expect(output).toEqual(expectedFailedPolicyOutput);
  });
});

describe('transformPolicyData', () => {
  it('returns an empty array when no policies are passed', async () => {
    const output = await transformPolicyData({ policies: [] }, [], []);
    expect(output).toEqual([]);
  });
});
