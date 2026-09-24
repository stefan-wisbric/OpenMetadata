/*
 *  Copyright 2026 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import { TFunction } from 'i18next';
import {
  SubscriptionCategory,
  Type,
} from '../../../generated/events/eventSubscription';
import { EventType } from '../../../generated/type/changeEvent';
import {
  getAuthTypeItems,
  getDestinationCategoryItems,
  getSelectArgumentConfig,
  getTemplateItems,
} from './AlertAiFormFieldsSelectUtils';
import {
  CUSTOM_TEMPLATE_VALUE,
  SYSTEM_DEFAULT_TEMPLATES,
} from './Template.constants';

jest.mock('./NotificationTemplateUtils', () => ({
  getTemplateEntityRefObject: jest.fn((template) => ({
    id: template.id,
    name: template.name,
    type: 'notificationTemplate',
  })),
}));

const t = ((key: string, params?: Record<string, string>) =>
  params ? `${key}:${Object.values(params).join(':')}` : key) as TFunction;

describe('AlertAiFormFieldsSelectUtils', () => {
  it('builds auth type select items', () => {
    expect(getAuthTypeItems(t)).toEqual([
      { id: Type.None, label: 'label.no-authentication' },
      { id: Type.Bearer, label: 'label.bearer-hmac-signature' },
      {
        id: Type.Oauth2,
        label: 'label.oauth2-client-credential-plural',
      },
    ]);
  });

  it('includes selected unloaded notification template in options', () => {
    const selectedTemplate = JSON.stringify({
      displayName: 'Custom Alert Template',
      name: 'custom_alert_template',
    });

    expect(getTemplateItems([], selectedTemplate, t)).toEqual([
      {
        id: selectedTemplate,
        label: 'Custom Alert Template',
      },
      {
        id: SYSTEM_DEFAULT_TEMPLATES,
        label: 'label.system-default-template',
      },
      {
        id: CUSTOM_TEMPLATE_VALUE,
        label: 'label.create-entity:label.custom-template',
      },
    ]);
  });

  it('limits event types to the ones the selected source supports', () => {
    const config = getSelectArgumentConfig('eventTypeList', t, [
      EventType.EntityCreated,
      EventType.EntityDeleted,
    ]);

    expect(config?.items.map((item) => item.id)).toEqual([
      EventType.EntityCreated,
      EventType.EntityDeleted,
    ]);
  });

  it('offers every event type when the source declares none', () => {
    const config = getSelectArgumentConfig('eventTypeList', t, []);

    expect(config?.items).toHaveLength(Object.values(EventType).length);
  });

  describe('destination categories are the ones the server offers (classic parity)', () => {
    const categoryIds = (offered?: string[], current?: string) =>
      getDestinationCategoryItems(t, offered, current).map((item) => item.id);

    it('offers only the internal categories the server offers, and every external one', () => {
      const ids = categoryIds([
        SubscriptionCategory.Owners,
        SubscriptionCategory.Followers,
      ]);

      expect(ids).toEqual(
        expect.arrayContaining([
          SubscriptionCategory.Owners,
          SubscriptionCategory.Followers,
        ])
      );
      expect(ids).not.toContain(SubscriptionCategory.Assignees);
      expect(ids).not.toContain(SubscriptionCategory.Mentions);
      expect(ids).toContain('header-external');
    });

    it('keeps the category a destination already has, so a saved alert stays editable', () => {
      const ids = categoryIds(
        [SubscriptionCategory.Owners],
        SubscriptionCategory.Assignees
      );

      expect(ids).toEqual(
        expect.arrayContaining([
          SubscriptionCategory.Owners,
          SubscriptionCategory.Assignees,
        ])
      );
    });

    it('offers no internal category until the server has answered', () => {
      const ids = categoryIds();

      expect(ids).not.toContain(SubscriptionCategory.Owners);
      expect(ids).toContain('header-external');
    });
  });
});
