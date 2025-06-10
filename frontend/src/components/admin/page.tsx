import { useState, useEffect } from "react"
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
import axios from "axios"
import { m } from "framer-motion"

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
  
const [data, setData] = useState<any[]>([])
const [loading, setLoading] = useState(false)

 useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem("token") 
        let params: any = {}

        if (search) params.search = search
        if (filters.region) params.region = filters.region
        if (filters.category) params.category = filters.category
        if (filters.createdAt) params.orderByDate = true
        if (filters.modsOnly) params.noMods = true

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          params
        }

        let response;
        switch (activeTab) {
          case "users":
            response = await axios.get("https://api.benchracershq.com/api/admin/users", {
              ...config,
              params: {
                search,
                region: filters.region || undefined,
                orderByDate: filters.createdAt || undefined,
                orderByName: !filters.createdAt || undefined
              }
            })
            setData(response.data.users)
            break
          case "entries":
            response = await axios.get("https://api.benchracershq.com/api/admin/entries", config)
            setData(response.data.entries)
            break
          case "mods":
            if (filters.modsOnly) params.usedByEntry = true
            response = await axios.get("https://api.benchracershq.com/api/admin/mods", config)
            setData(response.data.mods)
            break
          case "tags":
            response = await axios.get("https://api.benchracershq.com/api/admin/tags", { headers: config.headers })
            setData(response.data.tags)
            break
          case "photos":
            response = await axios.get("https://api.benchracershq.com/api/admin/photos", {
              headers: config.headers,
              params: {
                search: filters.modsOnly || undefined,
                mainOnly: filters.region || undefined
              }
            })
            setData(response.data.photos)
            break
          case "awards":
            response = await axios.get("https://api.benchracershq.com/api/admin/awards", {
              headers: config.headers,
              params: {
                search,
                type: filters.modsOnly || undefined,
                user: filters.modsOnly || undefined
              }
            })
            setData(response.data.awards)
            break
          default:
            setData([])
        }
      } catch (err) {
        console.error(`Error loading ${activeTab}:`, err)
        setData([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [activeTab, search, filters])

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1 py-12">
        <div className="container">
            <div className="flex flex-row justify-between">
                <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
            <Button
                    variant="destructive"
                    disabled={true}
                    onClick={async () => {
                        try {
                        const token = localStorage.getItem('token');
                        const res = await fetch('https://api.benchracershq.com/api/admin/reset', {
                            method: 'GET',
                            headers: {
                            Authorization: `Bearer ${token}`,
                            },
                        });
                        const data = await res.json();
                        if (data.success) {
                            alert('Database reset successfully');
                        } else {
                            alert('Reset failed: ' + data.message);
                        }
                        } catch (err) {
                        console.error('Error resetting DB:', err);
                        alert('An error occurred while resetting the database');
                        }
                    }}
                    >
                    RESET DATABASE
                </Button>
            </div>
          

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
                      {data.map((user) => (
                    <TableRow key={user.userEmail}>
                        <TableCell>{user.userEmail}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.region}</TableCell>
                        <TableCell>{new Date(user.accountCreated).toLocaleDateString()}</TableCell>
                        <TableCell>{user.totalEntries}</TableCell>
                        <TableCell>{user.isVerified ? 'Yes' : 'No'}</TableCell>
                        <TableCell>{user.isEditor ? 'Yes' : 'No'}</TableCell>
                        <TableCell>
                        <UserModal mode="edit" userData={user} />
                        </TableCell>
                    </TableRow>
                    ))}

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
                      {data.map((entry) => (
                        <TableRow key={entry.entryID}>
                            <TableCell>{entry.userEmail}</TableCell>
                            <TableCell>{entry.carName}</TableCell>
                            <TableCell>{entry.carColor}</TableCell>
                            <TableCell>{entry.carMake}</TableCell>
                            <TableCell>{entry.carModel}</TableCell>
                            <TableCell>{entry.carYear}</TableCell>
                            <TableCell>${entry.totalCost}</TableCell>
                            <TableCell>{entry.upvotes}</TableCell>
                            <TableCell>{entry.category}</TableCell>
                            <TableCell>{entry.region}</TableCell>
                            <TableCell>
                            <EntryModal mode="edit" entryData={entry} />
                            </TableCell>
                        </TableRow>
                        ))}
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
                      {data.map((mod) => (
                    <TableRow key={mod.modID}>
                        <TableCell>{mod.brand}</TableCell>
                        <TableCell>{mod.category}</TableCell>
                        <TableCell>${mod.cost}</TableCell>
                        <TableCell>{mod.description}</TableCell>
                        <TableCell>{mod.link}</TableCell>
                        <TableCell>
                        <ModModal mode="edit" modData={mod} />
                        </TableCell>
                    </TableRow>
                    ))}

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
                      {data.map((tag) => (
                        <TableRow key={tag.tagID}>
                            <TableCell>{tag.tagID}</TableCell>
                            <TableCell>{tag.tagName}</TableCell>
                            <TableCell>{tag.entryCount}</TableCell>
                            <TableCell>
                            <TagModal mode="edit" tagData={tag} />
                            </TableCell>
                        </TableRow>
                        ))}
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
                     {data.map((photo) => (
                        <TableRow key={photo.photoID}>
                            <TableCell>{photo.photoID}</TableCell>
                            <TableCell>{photo.entryID}</TableCell>
                            <TableCell>{photo.s3Key}</TableCell>
                            <TableCell>{photo.isMainPhoto ? 'Yes' : 'No'}</TableCell>
                            <TableCell>{new Date(photo.uploadDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                            <img src={`https://benchracers-photos.s3.us-west-2.amazonaws.com/${photo.s3Key}`} className="h-12 w-12 object-cover rounded" />
                            </TableCell>
                            <TableCell>
                            <PhotoModal mode="edit" photoData={photo} />
                            </TableCell>
                        </TableRow>
                        ))}
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
                      {data.map((award) => (
                        <TableRow key={award.awardID}>
                            <TableCell>{award.awardID}</TableCell>
                            <TableCell>{award.userEmail}</TableCell>
                            <TableCell>{award.awardType}</TableCell>
                            <TableCell>{new Date(award.awardDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                            <AwardModal mode="edit" awardData={award} />
                            </TableCell>
                        </TableRow>
                        ))}
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

function AddEntityButton({ entityType }: { entityType: string }) {
  const [open, setOpen] = useState(false)
  const buttonLabel = `Add ${entityType}`  
  
  const getEmptyData = () => {
    switch(entityType) {
      case "users":
        return {
          userEmail: "",
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

interface UserData {
  userEmail: string;
  name: string;
  password?: string;
  region: string;
  totalEntries: number;
  isVerified: boolean;
  isEditor: boolean;
}

function UserModal({
  mode = "edit",
  userData,
  open,
  setOpen,
}: {
  mode?: string
  userData?: UserData
  open?: boolean
  setOpen?: (open: boolean) => void
}) {
  const title = mode === "edit" ? "Edit User" : "Add User"
  const buttonText = mode === "edit" ? "Save Changes" : "Add User"
  const button2Text = "Delete User"

  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = typeof open !== "undefined" && typeof setOpen !== "undefined"
  const isOpen = isControlled ? open : internalOpen
  const onOpenChange = isControlled ? setOpen : setInternalOpen

  const [email, setEmail] = useState(userData?.userEmail || "")
  const [name, setName] = useState(userData?.name || "")
  const [password, setPassword] = useState("")
  const [region, setRegion] = useState(userData?.region || "")
  const [totalEntries] = useState(userData?.totalEntries || 0) 
  const [isVerified, setIsVerified] = useState(userData?.isVerified || false)
  const [isEditor, setIsEditor] = useState(userData?.isEditor || false)

  const handleSubmit = async () => {
    const token = localStorage.getItem("token")
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }

    const payload = {
      name,
      password,
      region,
      isVerified,
      isEditor,
    }
    
    console.log(userData);
    
    
    try {
      if (mode === "edit") {
        console.log("Editing user:", userData?.userEmail);
        await axios.put(
          `https://api.benchracershq.com/api/admin/updateusers/${email}`,
          payload,
          { headers }
        )
      } else {
        await axios.post(`https://api.benchracershq.com/api/admin/addusers`, {
          email,
          ...payload,
        }, { headers })
      }
      window.location.reload();


      onOpenChange(false)
    } catch (err) {
      console.error("Failed to submit user:", err)
    }
  }

  const handleDelete = async () => {
    if (!email) return
    const token = localStorage.getItem("token")
    const headers = { Authorization: `Bearer ${token}` }

    try {
      await axios.delete(`https://api.benchracershq.com/api/admin/delusers/${email}`, {
        headers,
      })
      window.location.reload();

      onOpenChange(false)
    } catch (err) {
      console.error("Failed to delete user:", err)
    }
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
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={mode === "edit"}
          />
          <Input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            placeholder="Region"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
          />
          <Input
            placeholder="Total Entries"
            type="number"
            value={totalEntries}
            disabled
          />

          <div className="flex items-center gap-2">
            <Checkbox
              checked={isVerified}
              onCheckedChange={(val) => setIsVerified(!!val)}
            />
            <span className="text-white">Is Verified</span>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={isEditor}
              onCheckedChange={(val) => setIsEditor(!!val)}
            />
            <span className="text-white">Is Editor</span>
          </div>
        </div>
        <DialogFooter className="pt-4">
          <Button type="submit" onClick={handleSubmit}>
            {buttonText}
          </Button>
          {mode === "edit" && (
            <Button type="submit" onClick={handleDelete}>
              {button2Text}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface EntryData {
  entryID?: number;
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
    const button2Text = mode === "edit" ? "Delete Entry" : "Delete Entry"
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = typeof open !== 'undefined' && typeof setOpen !== 'undefined'
    const isOpen = isControlled ? open : internalOpen
    const onOpenChange = isControlled ? setOpen : setInternalOpen
    
    const [email, setEmail] = useState(entryData?.email || "");
    const [carName, setCarName] = useState(entryData?.carName || "");
    const [carColor, setCarColor] = useState(entryData?.carColor || "");
    const [carMake, setCarMake] = useState(entryData?.carMake || "");
    const [carModel, setCarModel] = useState(entryData?.carModel || "");
    const [carYear, setCarYear] = useState(entryData?.carYear || "");
    const [totalCost, setTotalCost] = useState(entryData?.totalCost || 0);
        
    const [upvotes, setUpvotes] = useState(entryData?.upvotes || 0);
    const [category, setCategory] = useState(entryData?.category || "");
    const [region, setRegion] = useState(entryData?.region || "");
    const [engine, setEngine] = useState(entryData?.engine || "");
    const [transmission, setTransmission] = useState(entryData?.transmission || "");
    const [drivetrain, setDrivetrain] = useState(entryData?.drivetrain || "");
    const [horsepower, setHorsepower] = useState(entryData?.horsepower || 0);
    const [torque, setTorque] = useState(entryData?.torque || 0);
    
    
    const handleSubmit = async () => {
      const token = localStorage.getItem("token")
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
      
      try {
        const entryPayload = { email, carName, carColor, carMake, carModel, carYear, totalCost, upvotes, category, region, engine, transmission, drivetrain, horsepower, torque };

        if (mode === "edit") {
            await axios.put(`https://api.benchracershq.com/api/admin/updateentries/${entryData?.entryID}`, entryPayload, { headers });
        } else {
            await axios.post(`https://api.benchracershq.com/api/admin/addentries`, entryPayload, { headers });
        }
        
        window.location.reload();

        onOpenChange(false)
        } catch (err) {
            
            console.error("Failed to submit entry:", err)
        }
    }
    
    const handleDelete = async () => {
        if (!entryData) return;
        const token = localStorage.getItem("token")
        const headers = {
            Authorization: `Bearer ${token}`
        }
        try {
            await axios.delete(`https://api.benchracershq.com/api/admin/delentries/${entryData?.entryID}`, { headers });
        } catch (err) {
            console.error("Failed to delete entry:", err)
        }
        
        window.location.reload();

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
          {/* Left column */}
            <div className="space-y-4">
            <Input placeholder="User Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input placeholder="Car Name" value={carName} onChange={(e) => setCarName(e.target.value)} />
            <Input placeholder="Color" value={carColor} onChange={(e) => setCarColor(e.target.value)} />
            <Input placeholder="Make" value={carMake} onChange={(e) => setCarMake(e.target.value)} />
            <Input placeholder="Model" value={carModel} onChange={(e) => setCarModel(e.target.value)} />
            <Input placeholder="Year" value={carYear} onChange={(e) => setCarYear(e.target.value)} />
            <Input placeholder="Total Cost" type="number" value={totalCost} onChange={(e) => setTotalCost(Number(e.target.value))} />
            <Input placeholder="Upvotes" type="number" value={upvotes} onChange={(e) => setUpvotes(Number(e.target.value))} />
            </div>

            {/* Right column */}
            <div className="space-y-4">
            <Select value={category} onValueChange={setCategory}>
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

            <Input placeholder="Region" value={region} onChange={(e) => setRegion(e.target.value)} />
            <Input placeholder="Engine" value={engine} onChange={(e) => setEngine(e.target.value)} />
            <Input placeholder="Transmission" value={transmission} onChange={(e) => setTransmission(e.target.value)} />

            <Select value={drivetrain} onValueChange={setDrivetrain}>
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

            <Input placeholder="Horsepower" type="number" value={horsepower} onChange={(e) => setHorsepower(Number(e.target.value))} />
            <Input placeholder="Torque" type="number" value={torque} onChange={(e) => setTorque(Number(e.target.value))} />
            </div>

        </div>
  
        <DialogFooter className="pt-4">
          <Button type="submit" onClick={handleSubmit}>{buttonText}</Button>
          <Button type="submit" onClick={handleDelete}>{button2Text}</Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    )
  }

interface ModData {
  modID?: number;
  brand: string;
  category: string;
  cost: number;
  description: string;
  link: string;
}

function ModModal({ mode = "edit", modData, open, setOpen }: { mode?: string; modData?: ModData; open?: boolean; setOpen?: (open: boolean) => void  }) {
const title: any = mode === "edit" ? "Edit Modification" : "Add Modification"
  const buttonText = mode === "edit" ? "Save Changes" : "Add Modification"
  const button2Text = mode === "edit" ? "Delete Mod" : "Delete Mod"
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = typeof open !== 'undefined' && typeof setOpen !== 'undefined'
  const isOpen = isControlled ? open : internalOpen
  const onOpenChange = isControlled ? setOpen : setInternalOpen
  
  const [brand, setBrand] = useState(modData?.brand || "");
  const [category, setCategory] = useState(modData?.category || "");
  const [cost, setCost] = useState(modData?.cost || 0);
  const [description, setDescription] = useState(modData?.description || "");
  const [link, setLink] = useState(modData?.link || "");

  
  const handleSubmit = async () => {
  const token = localStorage.getItem("token")
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  }
  

  try {
    const modPayload = { brand, category, cost, description, link };

    if (mode === "edit") {
    await axios.put(`https://api.benchracershq.com/api/admin/updatemods/${modData?.modID}`, modPayload, { headers });
    } else {
    await axios.post(`https://api.benchracershq.com/api/admin/addmods`, modPayload, { headers });
    }
    window.location.reload();
    onOpenChange(false)
  } catch (err) {
    console.error("Failed to submit mod:", err)
  }
}

const handleDelete = async () => {
  if (!modData) return;
  const token = localStorage.getItem("token")
  const headers = {
    Authorization: `Bearer ${token}`
  }

  try {
    await axios.delete(`https://api.benchracershq.com/api/admin/delmods/${modData.modID}`, {
      headers,
      data: modData
    })
    window.location.reload();

    onOpenChange(false)
  } catch (err) {
    console.error("Failed to delete mod:", err)
  }
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
        <Input placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} />

        <Select value={category} onValueChange={setCategory}>
        <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
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

        <Input placeholder="Cost" type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} />
        <Textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Input placeholder="Link" value={link} onChange={(e) => setLink(e.target.value)} />

      </div>
      <DialogFooter className="pt-4">
        <Button type="submit" onClick={handleSubmit}>{buttonText}</Button>
        <Button type="submit" onClick={handleDelete}>{button2Text}</Button>
      </DialogFooter>
    </DialogContent>
    </Dialog>
  )
}

interface TagData {
  tagID: number;
  tagName: string;
  entryCount: number;
}

function TagModal({
  mode = "edit",
  tagData,
  open,
  setOpen,
}: {
  mode?: string;
  tagData?: TagData;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}) {
  const title = mode === "edit" ? "Edit Tag" : "Add Tag"
  const buttonText = mode === "edit" ? "Save Changes" : "Add Tag"
  const button2Text = "Delete Tag"

  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = typeof open !== "undefined" && typeof setOpen !== "undefined"
  const isOpen = isControlled ? open : internalOpen
  const onOpenChange = isControlled ? setOpen : setInternalOpen

  const [tagName, setTagName] = useState(tagData?.tagName || "")

  const handleSubmit = async () => {
    const token = localStorage.getItem("token")
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }

    try {
      if (mode === "edit" && tagData?.tagID !== undefined) {
        await axios.put(`https://api.benchracershq.com/api/admin/updatetags/${tagData.tagID}`, { tagName }, { headers })
      } else {
        await axios.post(`https://api.benchracershq.com/api/admin/addtags`, { tagName }, { headers })
      }
      window.location.reload();

      onOpenChange(false)
    } catch (err) {
      console.error("Failed to submit tag:", err)
    }
  }

  const handleDelete = async () => {
    if (!tagData?.tagID) return

    const token = localStorage.getItem("token")
    const headers = {
      Authorization: `Bearer ${token}`,
    }

    try {
      await axios.delete(`https://api.benchracershq.com/api/admin/tags/${tagData.tagID}`, { headers })
      window.location.reload();

      onOpenChange(false)
    } catch (err) {
      console.error("Failed to delete tag:", err)
    }
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
          <Input
            placeholder="Tag Name"
            value={tagName}
            onChange={(e) => setTagName(e.target.value)}
          />
        </div>
        <DialogFooter className="pt-4">
          <Button type="submit" onClick={handleSubmit}>
            {buttonText}
          </Button>
          {mode === "edit" && (
            <Button type="submit" onClick={handleDelete}>
              {button2Text}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
interface PhotoData {
  photoID: number;
  entryID: number;
  s3Key: string;
  isMainPhoto: boolean;
  uploadDate: string;
}

function PhotoModal({
  mode = "edit",
  photoData,
  open,
  setOpen,
}: {
  mode?: string;
  photoData?: PhotoData;
  open?: boolean;
  setOpen?: (open: boolean) => void;
}) {
  const title = mode === "edit" ? "Edit Photo" : "Add Photo"
  const buttonText = mode === "edit" ? "Save Changes" : "Add Photo"
  const button2Text = "Delete Photo"

  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = typeof open !== "undefined" && typeof setOpen !== "undefined"
  const isOpen = isControlled ? open : internalOpen
  const onOpenChange = isControlled ? setOpen : setInternalOpen

  const [entryID, setEntryID] = useState(photoData?.entryID || 0)
  const [s3Key, setS3Key] = useState(photoData?.s3Key || "")
  const [isMainPhoto, setIsMainPhoto] = useState(photoData?.isMainPhoto || false)
  const [uploadDate, setUploadDate] = useState(photoData?.uploadDate || "")

  const handleSubmit = async () => {
    const token = localStorage.getItem("token")
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }

    const payload = { entryID, s3Key, isMainPhoto, uploadDate }

    try {
      if (mode === "edit" && photoData?.photoID !== undefined) {
        await axios.put(`https://api.benchracershq.com/api/admin/updatephotos/${photoData.photoID}`, payload, { headers })
      } else {
        await axios.post(`https://api.benchracershq.com/api/admin/addphotos`, payload, { headers })
      }
      window.location.reload();

      onOpenChange(false)
    } catch (err) {
      console.error("Failed to submit photo:", err)
    }
  }

  const handleDelete = async () => {
    if (!photoData?.photoID) return
    const token = localStorage.getItem("token")
    const headers = {
      Authorization: `Bearer ${token}`
    }

    try {
      await axios.delete(`https://api.benchracershq.com/api/admin/delphotos/${photoData.photoID}`, { headers })
      window.location.reload();

      onOpenChange(false)
    } catch (err) {
      console.error("Failed to delete photo:", err)
    }
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
          <Input
            placeholder="Entry ID"
            type="number"
            value={entryID}
            onChange={(e) => setEntryID(Number(e.target.value))}
          />
          <Input
            placeholder="S3 Key"
            value={s3Key}
            onChange={(e) => setS3Key(e.target.value)}
          />
          <div className="flex flex-row items-center gap-2">
            <Checkbox checked={isMainPhoto} onCheckedChange={(checked) => setIsMainPhoto(!!checked)} />
            <span className="text-white">Is Main Photo</span>
          </div>
          <Input
            type="date"
            value={uploadDate}
            onChange={(e) => setUploadDate(e.target.value)}
          />

          {mode === "add" && (
            <div className="border-2 border-dashed border-gray-300 p-4 text-center rounded-md">
              <p className="text-gray-400">Upload Photo (Feature not implemented)</p>
            </div>
          )}
        </div>
        <DialogFooter className="pt-4">
          <Button type="submit" onClick={handleSubmit}>{buttonText}</Button>
          {mode === "edit" && (
            <Button type="submit" onClick={handleDelete}>{button2Text}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AwardData {
  awardID: number;
  userEmail: string;
  awardType: string;
  awardDate: string;
}

function AwardModal({
  mode = "edit",
  awardData,
  open,
  setOpen,
}: {
  mode?: string
  awardData?: AwardData
  open?: boolean
  setOpen?: (open: boolean) => void
}) {
  const title = mode === "edit" ? "Edit Award" : "Add Award"
  const buttonText = mode === "edit" ? "Save Changes" : "Add Award"
  const button2Text = "Delete Award"

  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = typeof open !== "undefined" && typeof setOpen !== "undefined"
  const isOpen = isControlled ? open : internalOpen
  const onOpenChange = isControlled ? setOpen : setInternalOpen

  const [userEmail, setUserEmail] = useState(awardData?.userEmail || "")
  const [awardType, setAwardType] = useState(awardData?.awardType || "")
  const [awardDate, setAwardDate] = useState(awardData?.awardDate || "")

  const handleSubmit = async () => {
    const token = localStorage.getItem("token")
    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    }

    const payload = { userEmail, awardType, awardDate }

    try {
      if (mode === "edit" && awardData?.awardID !== undefined) {
        await axios.put(
          `https://api.benchracershq.com/api/admin/updateawards/${awardData.awardID}`,
          payload,
          { headers }
        )
      } else {
        await axios.post(
          `https://api.benchracershq.com/api/admin/addawards`,
          payload,
          { headers }
        )
      }
      window.location.reload();

      onOpenChange(false)
    } catch (err) {
      console.error("Failed to submit award:", err)
    }
  }

  const handleDelete = async () => {
    if (!awardData?.awardID) return
    const token = localStorage.getItem("token")
    const headers = { Authorization: `Bearer ${token}` }

    try {
      await axios.delete(
        `https://api.benchracershq.com/api/admin/delawards/${awardData.awardID}`,
        { headers }
      )
      window.location.reload();

      onOpenChange(false)
    } catch (err) {
      console.error("Failed to delete award:", err)
    }
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
          <Input
            placeholder="User Email"
            value={userEmail}
            onChange={(e) => setUserEmail(e.target.value)}
          />

          <Select value={awardType} onValueChange={(val) => setAwardType(val)}>
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

          <Input
            type="date"
            value={awardDate}
            onChange={(e) => setAwardDate(e.target.value)}
          />
        </div>
        <DialogFooter className="pt-4">
          <Button type="submit" onClick={handleSubmit}>
            {buttonText}
          </Button>
          {mode === "edit" && (
            <Button type="submit" onClick={handleDelete}>
              {button2Text}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}