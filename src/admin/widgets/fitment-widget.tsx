import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Select } from "@medusajs/ui"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { useEffect, useState } from "react"

const FitmentWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const [vehicles, setVehicles] = useState([])
  const [wiperKits, setWiperKits] = useState([])
  const [selectedVehicles, setSelectedVehicles] = useState([])
  const [selectedWiperKits, setSelectedWiperKits] = useState([])
  
  // Fetch vehicles, wiper kits, and existing fitments for this product
  useEffect(() => {
    // You would implement these API calls to your backend
    const fetchData = async () => {
      // Fetch all available vehicles
      const vehiclesResponse = await fetch('/api/admin/vehicles')
      const vehiclesData = await vehiclesResponse.json()
      setVehicles(vehiclesData.vehicles)
      
      // Fetch all available wiper kits
      const wiperKitsResponse = await fetch('/api/admin/vehicles/kits')
      const wiperKitsData = await wiperKitsResponse.json()
      setWiperKits(wiperKitsData.wiperKits)
      
      // Fetch existing fitments for this product
      const fitmentsResponse = await fetch(`/api/admin/products/${data.id}/fitments`)
      const fitmentsData = await fitmentsResponse.json()
      
      // Set selected vehicles and wiper kits based on existing fitments
      setSelectedVehicles(fitmentsData.vehicles.map(v => v.id))
      setSelectedWiperKits(fitmentsData.wiperKits.map(w => w.id))
    }
    
    fetchData()
  }, [data.id])
  
  // Handle saving the fitment data
  const handleSave = async () => {
    await fetch(`/api/products/${data.id}/fitments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        vehicleIds: selectedVehicles,
        wiperKitIds: selectedWiperKits
      })
    })
  }
  
  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-4 px-6 py-4">
        <Heading level="h2">Vehicle Product Fitment</Heading>
        
        <div className="flex flex-col gap-2">
          <label>Compatible Vehicles</label>
          <Select>
            <Select.Trigger>
              <Select.Value placeholder="Select vehicles" />
            </Select.Trigger>
            <Select.Content>
              {vehicles.map((vehicle) => (
                <Select.Item key={vehicle.id} value={vehicle.id}>
                  {vehicle.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        
        <div className="flex flex-col gap-2">
          <label>Compatible Wiper Kits</label>
          <Select>
            <Select.Trigger>
              <Select.Value placeholder="Select wiper kits" />
            </Select.Trigger>
            <Select.Content>
              {wiperKits.map((wiperKit) => (
                <Select.Item key={wiperKit.id} value={wiperKit.id}>
                  {wiperKit.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        
        <button onClick={handleSave}>Save Fitments</button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.before",
})

export default FitmentWidget