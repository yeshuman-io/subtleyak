import { faker } from "@faker-js/faker"

const MAKES_COUNT = 10
const MODELS_PER_MAKE = 4
const VEHICLES_PER_MODEL = 3
const BODY_TYPES_COUNT = 8

type VehicleModel = {
  id: string;
  name: string;
  make_id: string;
}

type VehicleModelsResponse = {
  data: VehicleModel[];
  count: number;
  limit: number;
  offset: number;
}

export default async function seed({ container, options }) {

  const vehicleService = container.resolve("vehicles")

  // // Get all properties and methods, including inherited ones
  // const getAllProps = obj => {
  //   const props = new Set()
  //   let current = obj
  //   do {
  //     Object.getOwnPropertyNames(current).forEach(prop => props.add(prop))
  //   } while ((current = Object.getPrototypeOf(current)))
  //   return [...props]
  // }

  // console.log("Available methods and properties on vehicleService:")
  // console.log(getAllProps(vehicleService))

  console.info("Starting vehicle seed...")

  try {
    // Create vehicle makes
    const makes = await Promise.all(
      Array.from({ length: MAKES_COUNT }).map(async () => {
        return await vehicleService.createVehicleMakes({
          name: faker.vehicle.manufacturer()
        })
      })
    )
    console.info(`Created ${makes.length} vehicle makes`)

    // Create vehicle models for each make
    for (const make of makes) {
      await Promise.all(
        Array.from({ length: MODELS_PER_MAKE }).map(async () => {
          return await vehicleService.createVehicleModels({
            name: faker.vehicle.model(),
            make_id: make.id
          })
        })
      )
    }
    console.info(`Created ${MAKES_COUNT * MODELS_PER_MAKE} vehicle models`)

    // Create vehicles with different year ranges
    for (const make of makes) {
      const response = await vehicleService.listVehicleModels({ 
        make_id: make.id 
      }) as VehicleModelsResponse
      console.log("Vehicle models response:", JSON.stringify(response, null, 2))
      
      const makeModels = response.data || []

      for (const model of makeModels) {
        await Promise.all(
          Array.from({ length: VEHICLES_PER_MODEL }).map(async () => {
            const startYear = faker.number.int({ min: 2000, max: 2020 })
            return await vehicleService.createVehicles({
              start_year: startYear,
              end_year: startYear + faker.number.int({ min: 1, max: 5 }),
              make_id: make.id,
              model_id: model.id
            })
          })
        )
      }
    }
    console.info(`Created ${MAKES_COUNT * MODELS_PER_MAKE * VEHICLES_PER_MODEL} vehicles`)

    // Get all models to associate with bodies
    const response = await vehicleService.listVehicleModels({}) as VehicleModelsResponse
    console.log("All vehicle models response:", JSON.stringify(response, null, 2))
    
    const models = response.data || []

    // Create vehicle bodies and associate them with random models
    const bodies = await Promise.all(
      Array.from({ length: BODY_TYPES_COUNT }).map(async () => {
        // Get a random subset of models for this body type
        const modelCount = faker.number.int({ min: 2, max: 6 })
        const randomModels = faker.helpers.arrayElements(models, modelCount) as VehicleModel[]
        
        return await vehicleService.createVehicleBodies({
          name: faker.vehicle.type(),
          models: randomModels.map(model => ({ id: model.id }))
        })
      })
    )
    console.info(`Created ${bodies.length} vehicle bodies`)

  } catch (error) {
    console.error("Failed to seed vehicles data")
    console.error(error)
    throw error
  }

  console.info("✨ Vehicle seeding completed!")
}
