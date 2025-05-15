import { useState } from "react"
import Link from "next/link"
import { Navbar } from "../utils/navbar"
import { Footer } from "../utils/footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { Button } from "../ui/button"
import { Card, CardContent } from "../ui/card"
import { Badge } from "../ui/badge"
import { Input } from "../ui/input"
import { Checkbox } from "../ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table"
import { Users, Car, Wrench, Tag, ImageIcon, Trophy, Plus } from "lucide-react"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Textarea } from "../ui/textarea"

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("users")
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState({ region: false, category: false, modsOnly: false, createdAt: false })
  
  const tabSections = [
    { value: "users", label: "Users", icon: <Users className="w-4 h-4 mr-1" /> },
    { value: "entries", label: "Entries", icon: <Car className="w-4 h-4 mr-1" /> },
    { value: "mods", label: "Mods", icon: <Wrench className="w-4 h-4 mr-1" /> },
    { value: "tags", label: "Tags", icon: <Tag className="w-4 h-4 mr-1" /> },
    { value: "photos", label: "Photos", icon: <ImageIcon className="w-4 h-4 mr-1" /> },
    { value: "awards", label: "Awards", icon: <Trophy className="w-4 h-4 mr-1" /> },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container">
          <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex flex-wrap gap-2">
              {tabSections.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="flex items-center">
                  {tab.icon} {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {activeTab === "users" || activeTab === "entries" || activeTab === "mods" || activeTab === "tags" || activeTab === "photos" || activeTab === "awards" ? (
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder={`Search ${activeTab}...`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                  />
                  <AddEntityButton entityType={activeTab} />
                  
                </div>
                {activeTab === "users" && (
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={filters.createdAt}
                        onCheckedChange={(val) => setFilters(prev => ({ ...prev, createdAt: !!val }))}
                      />
                      Order by Date
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={filters.region}
                        onCheckedChange={(val) => setFilters(prev => ({ ...prev, region: !!val }))}
                      />
                      Search by Region
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={filters.region}
                        onCheckedChange={(val) => setFilters(prev => ({ ...prev, region: !!val }))}
                      />
                      Search by Name
                    </label>
                  </div>
                )}
                {activeTab === "entries" && (
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={filters.modsOnly}
                        onCheckedChange={(val) => setFilters(prev => ({ ...prev, modsOnly: !!val }))}
                      />
                      No Mods Only
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={filters.region}
                        onCheckedChange={(val) => setFilters(prev => ({ ...prev, region: !!val }))}
                      />
                      Search by Region
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={filters.category}
                        onCheckedChange={(val) => setFilters(prev => ({ ...prev, category: !!val }))}
                      />
                      Search by Category
                    </label>
                  </div>
                )}
                {activeTab === "mods" && (
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={filters.region}
                        onCheckedChange={(val) => setFilters(prev => ({ ...prev, region: !!val }))}
                      />
                      Used by Entry
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={filters.category}
                        onCheckedChange={(val) => setFilters(prev => ({ ...prev, category: !!val }))}
                      />
                      Search by category
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={filters.modsOnly}
                        onCheckedChange={(val) => setFilters(prev => ({ ...prev, modsOnly: !!val }))}
                      />
                      Search by brand
                    </label>
                  </div>
                )}
                {activeTab === "tags" && (
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={filters.region}
                        onCheckedChange={(val) => setFilters(prev => ({ ...prev, region: !!val }))}
                      />
                      Used by Entry
                    </label>
                  </div>
                )}
                {activeTab === "photos" && (
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={filters.region}
                        onCheckedChange={(val) => setFilters(prev => ({ ...prev, region: !!val }))}
                      />
                      Main Photos
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={filters.modsOnly}
                        onCheckedChange={(val) => setFilters(prev => ({ ...prev, modsOnly: !!val }))}
                      />
                      Search by s3Key
                    </label>
                  </div>
                )}
                {activeTab === "awards" && (
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={filters.region}
                        onCheckedChange={(val) => setFilters(prev => ({ ...prev, region: !!val }))}
                      />
                      View Date
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={filters.modsOnly}
                        onCheckedChange={(val) => setFilters(prev => ({ ...prev, modsOnly: !!val }))}
                      />
                      Search by Type
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={filters.modsOnly}
                        onCheckedChange={(val) => setFilters(prev => ({ ...prev, modsOnly: !!val }))}
                      />
                      Search by User
                    </label>
                  </div>
                )}
              </div>
            ) : null}

            <TabsContent value="users">
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-4">User Management</h2>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Account Created</TableHead>
                        <TableHead>Total Entries</TableHead>
                        <TableHead>Is Verified</TableHead>
                        <TableHead>Is Editor</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>jane@example.com</TableCell>
                        <TableCell>Jane Doe</TableCell>
                        <TableCell>West</TableCell>
                        <TableCell>2024-02-01</TableCell>
                        <TableCell>3</TableCell>
                        <TableCell>Yes</TableCell>
                        <TableCell>No</TableCell>
                        <TableCell>
                          <UserModal mode="edit" userData={{
                            email: "jane@example.com",
                            name: "Jane Doe",
                            region: "West",
                            totalEntries: 3,
                            isVerified: true,
                            isEditor: false
                          }} />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="entries">
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-4">Entry Management</h2>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Car</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead>Make</TableHead>
                        <TableHead>Model</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Upvotes</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Region</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>anthony@gmail.com</TableCell>
                        <TableCell>Project Z</TableCell>
                        <TableCell>Black</TableCell>
                        <TableCell>Nissan</TableCell>
                        <TableCell>350 Z</TableCell>
                        <TableCell>2005</TableCell>
                        <TableCell>$20,000</TableCell>
                        <TableCell>10</TableCell>
                        <TableCell>Track</TableCell>
                        <TableCell>Oregon</TableCell>
                        <TableCell>
                          <EntryModal mode="edit" entryData={{
                            email: "anthony@gmail.com",
                            carName: "Project Z",
                            carColor: "Black",
                            carMake: "Nissan",
                            carModel: "350 Z",
                            carYear: "2005",
                            totalCost: 20000,
                            upvotes: 10,
                            category: "Track",
                            region: "Oregon",
                            engine: "VQ35DE",
                            transmission: "6-speed manual",
                            drivetrain: "RWD",
                            horsepower: 300,
                            torque: 270
                          }} />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mods">
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-4">Modifications</h2>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Brand</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Link</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>HKS</TableCell>
                        <TableCell>Exhaust</TableCell>
                        <TableCell>$900</TableCell>
                        <TableCell>Hi-Power Cat-Back Exhaust System</TableCell>
                        <TableCell>https://hks.com/exhaust</TableCell>
                        <TableCell>
                          <ModModal mode="edit" modData={{
                            brand: "HKS",
                            category: "Exhaust",
                            cost: 900,
                            description: "Hi-Power Cat-Back Exhaust System",
                            link: "https://hks.com/exhaust"
                          }} />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tags">
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-4">Tag Management</h2>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tag ID</TableHead>
                        <TableHead>Tag Name</TableHead>
                        <TableHead>Entry Count</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>1</TableCell>
                        <TableCell>JDM</TableCell>
                        <TableCell>15</TableCell>
                        <TableCell>
                          <TagModal mode="edit" tagData={{
                            tagID: 1,
                            tagName: "JDM",
                            entryCount: 15
                          }} />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="photos">
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-4">Photo Viewer</h2>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Photo ID</TableHead>
                        <TableHead>Entry ID</TableHead>
                        <TableHead>S3 Key</TableHead>
                        <TableHead>Is Main Photo</TableHead>
                        <TableHead>Upload Date</TableHead>
                        <TableHead>Preview</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>101</TableCell>
                        <TableCell>5</TableCell>
                        <TableCell>entries/5/main.jpg</TableCell>
                        <TableCell>Yes</TableCell>
                        <TableCell>2024-05-01</TableCell>
                        <TableCell>
                          <div className="w-12 h-12 bg-gray-200 rounded"></div>
                        </TableCell>
                        <TableCell>
                          <PhotoModal mode="edit" photoData={{
                            photoID: 101,
                            entryID: 5,
                            s3Key: "entries/5/main.jpg",
                            isMainPhoto: true,
                            uploadDate: "2024-05-01"
                          }} />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="awards">
              <Card className="mt-6">
                <CardContent className="pt-6">
                  <h2 className="text-xl font-semibold mb-4">Awards</h2>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Award ID</TableHead>
                        <TableHead>User Email</TableHead>
                        <TableHead>Award Type</TableHead>
                        <TableHead>Award Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>1</TableCell>
                        <TableCell>anthony@gmail.com</TableCell>
                        <TableCell>Best In Show</TableCell>
                        <TableCell>2024-04-15</TableCell>
                        <TableCell>
                          <AwardModal mode="edit" awardData={{
                            awardID: 1,
                            userEmail: "anthony@gmail.com",
                            awardType: "Best In Show",
                            awardDate: "2024-04-15"
                          }} />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}

// Add Button Component that shows appropriate modal for each entity type
function AddEntityButton({ entityType }: { entityType: string }) {
  const [open, setOpen] = useState(false)
  const buttonLabel = `Add ${entityType}`  // Remove 's' from plural
  
  const getEmptyData = () => {
    switch(entityType) {
      case "users":
        return {
          email: "",
          name: "",
          password: "",
          region: "",
          totalEntries: 0,
          isVerified: false,
          isEditor: false
        }
      case "entries":
        return {
          email: "",
          carName: "",
          carColor: "",
          carMake: "",
          carModel: "",
          carYear: "",
          totalCost: 0,
          upvotes: 0,
          category: "",
          region: "",
          engine: "",
          transmission: "",
          drivetrain: "",
          horsepower: 0,
          torque: 0
        }
      case "mods":
        return {
          brand: "",
          category: "",
          cost: 0,
          description: "",
          link: ""
        }
      case "tags":
        return {
          tagID: 0,
          tagName: "",
          entryCount: 0
        }
      case "photos":
        return {
          photoID: 0,
          entryID: 0,
          s3Key: "",
          isMainPhoto: false,
          uploadDate: new Date().toISOString().split('T')[0]
        }
      case "awards":
        return {
          awardID: 0,
          userEmail: "",
          awardType: "",
          awardDate: new Date().toISOString().split('T')[0]
        }
      default: 
        return {}
    }
  }

  const getModalComponent = () => {
    const emptyData = getEmptyData()
    
    switch(entityType) {
      case "users":
        return <UserModal mode="add" userData={emptyData as UserData} open={open} setOpen={setOpen}/>
      case "entries":
        return <EntryModal mode="add" entryData={emptyData as EntryData} open={open} setOpen={setOpen}/>
      case "mods":
        return <ModModal mode="add" modData={emptyData as ModData} open={open} setOpen={setOpen}/>
      case "tags":
        return <TagModal mode="add" tagData={emptyData as TagData} open={open} setOpen={setOpen}/>
      case "photos":
        return <PhotoModal mode="add" photoData={emptyData as PhotoData} open={open} setOpen={setOpen}/>
      case "awards":
        return <AwardModal mode="add" awardData={emptyData as AwardData} open={open} setOpen={setOpen}/>
      default:
        return null
    }
  }

  return (
    <div>
    <Button variant="default" size="sm" className="flex items-center" onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-1" /> {buttonLabel}
    </Button>
    {getModalComponent()}
    </div>
  )
}

// User Modal Component
interface UserData {
  email: string;
  name: string;
  password?: string;
  region: string;
  totalEntries: number;
  isVerified: boolean;
  isEditor: boolean;
}

function UserModal({ mode = "edit", userData, open, setOpen }: { mode?: string; userData: UserData; open?: boolean; setOpen?: (open: boolean) => void }) {
    const title = mode === "edit" ? "Edit User" : "Add User"
    const buttonText = mode === "edit" ? "Save Changes" : "Add User"
    
    // For edit modals where open/setOpen isn't passed as props
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = typeof open !== 'undefined' && typeof setOpen !== 'undefined'
    const isOpen = isControlled ? open : internalOpen
    const onOpenChange = isControlled ? setOpen : setInternalOpen
  
    const handleSubmit = () => {
      // Handle form submission logic here
      onOpenChange(false)
    }
  
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
         {!isControlled && mode === "edit" && (
          <DialogTrigger asChild>
            <Button size="sm">Edit</Button>
          </DialogTrigger>
        )}
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">{title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Email" defaultValue={userData.email} />
            <Input placeholder="Name" defaultValue={userData.name} />
            <Input placeholder="Password" type="password" defaultValue="" />
            <Input placeholder="Region" defaultValue={userData.region} />
            <Input placeholder="Total Entries" type="number" defaultValue={userData.totalEntries} />
            
            <div className="flex flex-row items-center gap-2">
              <Checkbox defaultChecked={userData.isVerified} />
              <span className="text-white">Is Verified</span>
            </div>
            
            <div className="flex flex-row items-center gap-2">
              <Checkbox defaultChecked={userData.isEditor} />
              <span className="text-white">Is Editor</span>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" onClick={handleSubmit}>{buttonText}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

// Entry Modal Component
interface EntryData {
  email: string;
  carName: string;
  carColor: string;
  carMake: string;
  carModel: string;
  carYear: string;
  totalCost: number;
  upvotes: number;
  category: string;
  region: string;
  engine: string;
  transmission: string;
  drivetrain: string;
  horsepower: number;
  torque: number;
}

function EntryModal({ mode = "edit", entryData, open, setOpen }: { mode?: string; entryData?: EntryData; open?: boolean; setOpen?: (open: boolean) => void  }) {
    const title = mode === "edit" ? "Edit Entry" : "Add Entry"
    const buttonText = mode === "edit" ? "Save Changes" : "Add Entry"
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = typeof open !== 'undefined' && typeof setOpen !== 'undefined'
    const isOpen = isControlled ? open : internalOpen
    const onOpenChange = isControlled ? setOpen : setInternalOpen
    
    const handleSubmit = () => {
      // Handle form submission logic here
      onOpenChange(false)
    }
  
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {!isControlled && mode === "edit" && (
        <DialogTrigger asChild>
          <Button size="sm">Edit</Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-white">{title}</DialogTitle>
        </DialogHeader>
        
        {/* Two-column layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left column */}
          <div className="space-y-4">
            <Input placeholder="User Email" defaultValue={entryData?.email || ""} />
            <Input placeholder="Car Name" defaultValue={entryData?.carName} />
            <Input placeholder="Color" defaultValue={entryData?.carColor} />
            <Input placeholder="Make" defaultValue={entryData?.carMake} />
            <Input placeholder="Model" defaultValue={entryData?.carModel} />
            <Input placeholder="Year" defaultValue={entryData?.carYear} />
            <Input placeholder="Total Cost" type="number" defaultValue={entryData?.totalCost} />
            <Input placeholder="Upvotes" type="number" defaultValue={entryData?.upvotes} />
          </div>
  
          {/* Right column */}
          <div className="space-y-4">
            <Select defaultValue={entryData?.category}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Track">Track</SelectItem>
                <SelectItem value="Show">Show</SelectItem>
                <SelectItem value="Daily">Daily</SelectItem>
                <SelectItem value="Offroad">Offroad</SelectItem>
              </SelectContent>
            </Select>
            
            <Input placeholder="Region" defaultValue={entryData?.region} />
            <Input placeholder="Engine" defaultValue={entryData?.engine} />
            <Input placeholder="Transmission" defaultValue={entryData?.transmission} />
            
            <Select defaultValue={entryData?.drivetrain}>
              <SelectTrigger>
                <SelectValue placeholder="Drivetrain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FWD">FWD</SelectItem>
                <SelectItem value="RWD">RWD</SelectItem>
                <SelectItem value="AWD">AWD</SelectItem>
                <SelectItem value="4WD">4WD</SelectItem>
              </SelectContent>
            </Select>
            
            <Input placeholder="Horsepower" type="number" defaultValue={entryData?.horsepower} />
            <Input placeholder="Torque" type="number" defaultValue={entryData?.torque} />
          </div>
        </div>
  
        <DialogFooter className="pt-4">
          <Button type="submit" onClick={handleSubmit}>{buttonText}</Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    )
  }

// Mod Modal Component
interface ModData {
  brand: string;
  category: string;
  cost: number;
  description: string;
  link: string;
}

function ModModal({ mode = "edit", modData, open, setOpen }: { mode?: string; modData?: ModData; open?: boolean; setOpen?: (open: boolean) => void  }) {
const title: any = mode === "edit" ? "Edit Modification" : "Add Modification"
  const buttonText = mode === "edit" ? "Save Changes" : "Add Modification"
  
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = typeof open !== 'undefined' && typeof setOpen !== 'undefined'
  const isOpen = isControlled ? open : internalOpen
  const onOpenChange = isControlled ? setOpen : setInternalOpen
  
  const handleSubmit = () => {
    // Handle form submission logic here
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
    {!isControlled && mode === "edit" &&(
      <DialogTrigger asChild>
        <Button size="sm">Edit</Button>
      </DialogTrigger>
    )}
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-white">{title}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <Input placeholder="Brand" defaultValue={modData?.brand} />
        
        <Select defaultValue={modData?.category}>
          <SelectTrigger>
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Exhaust">Exhaust</SelectItem>
            <SelectItem value="Intake">Intake</SelectItem>
            <SelectItem value="Suspension">Suspension</SelectItem>
            <SelectItem value="Wheels">Wheels</SelectItem>
            <SelectItem value="Brakes">Brakes</SelectItem>
            <SelectItem value="Exterior">Exterior</SelectItem>
            <SelectItem value="Interior">Interior</SelectItem>
            <SelectItem value="Engine">Engine</SelectItem>
          </SelectContent>
        </Select>
        
        <Input placeholder="Cost" type="number" defaultValue={modData?.cost} />
        <Textarea placeholder="Description" defaultValue={modData?.description} />
        <Input placeholder="Link" defaultValue={modData?.link} />
      </div>
      <DialogFooter className="pt-4">
        <Button type="submit">{buttonText}</Button>
      </DialogFooter>
    </DialogContent>
    </Dialog>
  )
}

// Tag Modal Component
interface TagData {
  tagID: number;
  tagName: string;
  entryCount: number;
}

function TagModal({ mode = "edit", tagData, open, setOpen }: { mode?: string; tagData?: TagData; open?: boolean; setOpen?: (open: boolean) => void }) {
  const title = mode === "edit" ? "Edit Tag" : "Add Tag"
  const buttonText = mode === "edit" ? "Save Changes" : "Add Tag"
  
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = typeof open !== 'undefined' && typeof setOpen !== 'undefined'
  const isOpen = isControlled ? open : internalOpen
  const onOpenChange = isControlled ? setOpen : setInternalOpen
  
  const handleSubmit = () => {
    // Handle form submission logic here
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
    {!isControlled && mode === "edit" &&(
      <DialogTrigger asChild>
        <Button size="sm">Edit</Button>
      </DialogTrigger>
    )}
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-white">{title}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <Input placeholder="Tag Name" defaultValue={tagData?.tagName} />
      </div>
      <DialogFooter className="pt-4">
        <Button type="submit">{buttonText}</Button>
      </DialogFooter>
    </DialogContent>
    </Dialog>
  )
}

// Photo Modal Component
interface PhotoData {
  photoID: number;
  entryID: number;
  s3Key: string;
  isMainPhoto: boolean;
  uploadDate: string;
}

function PhotoModal({ mode = "edit", photoData, open, setOpen }: { mode: string; photoData: PhotoData; open?: boolean; setOpen?: (open: boolean) => void  }) {
  const title = mode === "edit" ? "Edit Photo" : "Add Photo"
  const buttonText = mode === "edit" ? "Save Changes" : "Add Photo"
  
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = typeof open !== 'undefined' && typeof setOpen !== 'undefined'
  const isOpen = isControlled ? open : internalOpen
  const onOpenChange = isControlled ? setOpen : setInternalOpen
  
  const handleSubmit = () => {
    // Handle form submission logic here
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
    {!isControlled && mode === "edit" &&(
      <DialogTrigger asChild>
        <Button size="sm">Edit</Button>
      </DialogTrigger>
    )}
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-white">{title}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <Input placeholder="Entry ID" type="number" defaultValue={photoData.entryID} />
        <Input placeholder="S3 Key" defaultValue={photoData.s3Key} />
        
        <div className="flex flex-row items-center gap-2">
          <Checkbox defaultChecked={photoData.isMainPhoto} />
          <span className="text-white">Is Main Photo</span>
        </div>
        
        <Input type="date" defaultValue={photoData.uploadDate} />
        
        {mode === "add" && (
          <div className="border-2 border-dashed border-gray-300 p-4 text-center rounded-md">
            <p className="text-gray-400">Upload Photo (Feature not implemented)</p>
          </div>
        )}
      </div>
      <DialogFooter className="pt-4">
        <Button type="submit">{buttonText}</Button>
      </DialogFooter>
    </DialogContent>
    </Dialog>
  )
}

// Award Modal Component
interface AwardData {
  awardID: number;
  userEmail: string;
  awardType: string;
  awardDate: string;
}

function AwardModal({ mode = "edit", awardData, open, setOpen }: { mode: string; awardData: AwardData; open?: boolean; setOpen?: (open: boolean) => void   }) {
  const title = mode === "edit" ? "Edit Award" : "Add Award"
  const buttonText = mode === "edit" ? "Save Changes" : "Add Award"
  
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = typeof open !== 'undefined' && typeof setOpen !== 'undefined'
  const isOpen = isControlled ? open : internalOpen
  const onOpenChange = isControlled ? setOpen : setInternalOpen
  
  const handleSubmit = () => {
    // Handle form submission logic here
    onOpenChange(false)
  }


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
    {!isControlled && mode === "edit" &&(
      <DialogTrigger asChild>
        <Button size="sm">Edit</Button>
      </DialogTrigger>
    )}
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-white">{title}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <Input placeholder="User Email" defaultValue={awardData.userEmail} />
        
        <Select defaultValue={awardData.awardType}>
          <SelectTrigger>
            <SelectValue placeholder="Award Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Best In Show">Best In Show</SelectItem>
            <SelectItem value="Editor's Choice">Editor's Choice</SelectItem>
            <SelectItem value="People's Choice">People's Choice</SelectItem>
            <SelectItem value="Best Modification">Best Modification</SelectItem>
            <SelectItem value="Best Interior">Best Interior</SelectItem>
            <SelectItem value="Best Exterior">Best Exterior</SelectItem>
          </SelectContent>
        </Select>
        
        <Input type="date" defaultValue={awardData.awardDate} />
      </div>
      <DialogFooter className="pt-4">
        <Button type="submit">{buttonText}</Button>
      </DialogFooter>
    </DialogContent>
    </Dialog>
  )
}