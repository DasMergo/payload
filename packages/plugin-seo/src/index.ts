import type { Config } from 'payload/config'
import type { Field, GroupField, TabsField } from 'payload/dist/fields/config/types'

import { deepMerge } from 'payload/dist/utilities/deepMerge'

import type { PluginConfig } from './types'

import { getMetaDescriptionField } from './fields/MetaDescription'
import { getMetaImageField } from './fields/MetaImage'
import { getMetaTitleField } from './fields/MetaTitle'
import translations from './translations'
import { Overview } from './ui/Overview'
import { getPreviewField } from './ui/Preview'

const seo =
  (pluginConfig: PluginConfig) =>
  (config: Config): Config => {
    const seoFields: GroupField[] = [
      {
        name: 'meta',
        type: 'group',
        fields: [
          {
            name: 'overview',
            type: 'ui',
            admin: {
              components: {
                Field: Overview,
              },
            },
            label: 'Overview',
          },
          {
            name: 'title',
            type: 'text',
            admin: {
              components: {
                Field: (props) => getMetaTitleField({ ...props, pluginConfig }),
              },
            },
            localized: true,
          },
          {
            name: 'description',
            type: 'textarea',
            admin: {
              components: {
                Field: (props) => getMetaDescriptionField({ ...props, pluginConfig }),
              },
            },
            localized: true,
          },
          ...(pluginConfig?.uploadsCollection
            ? [
                // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
                {
                  name: 'image',
                  type: 'upload',
                  admin: {
                    components: {
                      Field: (props) => getMetaImageField({ ...props, pluginConfig }),
                    },
                    description:
                      'Maximum upload file size: 12MB. Recommended file size for images is <500KB.',
                  },
                  label: 'Meta Image',
                  localized: true,
                  relationTo: pluginConfig?.uploadsCollection,
                } as Field,
              ]
            : []),
          ...(pluginConfig?.fields || []),
          {
            name: 'preview',
            type: 'ui',
            admin: {
              components: {
                Field: (props) => getPreviewField({ ...props, pluginConfig }),
              },
            },
            label: 'Preview',
          },
        ],
        label: 'SEO',
      },
    ]

    return {
      ...config,
      collections:
        config.collections?.map((collection) => {
          const { slug } = collection
          const isEnabled = pluginConfig?.collections?.includes(slug)

          if (isEnabled) {
            if (pluginConfig?.tabbedUI) {
              const seoTabs: TabsField[] = [
                {
                  type: 'tabs',
                  tabs: [
                    // append a new tab onto the end of the tabs array, if there is one at the first index
                    // if needed, create a new `Content` tab in the first index for this collection's base fields

                    ...(collection?.fields?.[0].type === 'tabs'
                      ? collection.fields[0]?.tabs || []
                      : [
                          {
                            fields: [...(collection?.fields || [])],
                            label: collection?.labels?.singular || 'Content',
                          },
                        ]),
                    {
                      fields: seoFields,
                      label: 'SEO',
                    },
                  ],
                },
              ]

              return {
                ...collection,
                fields: [
                  ...seoTabs,
                  ...(collection?.fields
                    ? collection.fields[0].type === 'tabs'
                      ? collection.fields.slice(1)
                      : []
                    : []),
                ],
              }
            }

            return {
              ...collection,
              fields: [...(collection?.fields || []), ...seoFields],
            }
          }

          return collection
        }) || [],
      globals:
        config.globals?.map((global) => {
          const { slug } = global
          const isEnabled = pluginConfig?.globals?.includes(slug)

          if (isEnabled) {
            if (pluginConfig?.tabbedUI || false) {
              const seoTabs: TabsField[] = [
                {
                  type: 'tabs',
                  tabs: [
                    // append a new tab onto the end of the tabs array, if there is one at the first index
                    // if needed, create a new `Content` tab in the first index for this global's base fields
                    ...(global?.fields?.[0]?.type === 'tabs'
                      ? global.fields[0]?.tabs || []
                      : [
                          {
                            fields: [...(global?.fields || [])],
                            label: global?.label || 'Content',
                          },
                        ]),

                    {
                      fields: seoFields,
                      label: 'SEO',
                    },
                  ],
                },
              ]

              return {
                ...global,
                fields: [
                  ...seoTabs,
                  ...(global?.fields ||
                    (global.fields[0].type === 'tabs' ? global.fields.slice(1) : [])),
                ],
              }
            }

            return {
              ...global,
              fields: [...(global?.fields || []), ...seoFields],
            }
          }

          return global
        }) || [],
      i18n: {
        ...config.i18n,
        resources: {
          ...deepMerge(translations, config.i18n?.resources),
        },
      },
    }
  }

export default seo
