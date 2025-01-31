import { faker } from "@faker-js/faker"

const MAKES_COUNT = 10
const MODELS_PER_MAKE = 4
const VEHICLES_PER_MODEL = 3

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
      const makeModels = await vehicleService.listVehicleModels({ 
        make_id: make.id 
      })

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
  } catch (error) {
    console.error("Failed to seed vehicles data")
    console.error(error)
    throw error
  }

  console.info("✨ Vehicle seeding completed!")
}
