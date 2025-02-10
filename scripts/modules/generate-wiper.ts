export const config = {
  moduleName: "wipers",
  singular: "wiper",
  plural: "wipers",
  models: [
    {
      name: "wiper",
      singular: "wiper",
      plural: "wipers",
      fields: [
        { 
          name: "name",
          type: "string",
          required: true
        },
        {
          name: "description",
          type: "string",
          required: false
        }
      ]
    }
  ]
}; 