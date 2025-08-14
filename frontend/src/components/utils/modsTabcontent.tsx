import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Loader2, Plus, X, Search } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Mod } from "../contexts/garagecontext"; // Adjust the import path as necessary


interface CustomMod {
  category: string;
  type: string;
  brand: string;
  partNumber: string;
  description: string;
  cost: string;
}

interface ModsTabContentProps {
  availableMods: Mod[];
  selectedMods: Mod[];
  onAddMod: (mod: Mod) => void;
  onRemoveMod: (mod: Mod) => void;
  isLoadingMods: boolean;
  setActiveTab: (tab: string) => void;
}

export function ModsTabContent({ 
  availableMods, 
  selectedMods, 
  onAddMod, 
  onRemoveMod, 
  isLoadingMods,
  setActiveTab 
}: ModsTabContentProps) {
  
  

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCustomForm, setShowCustomForm] = useState<boolean>(false);
  const [customMod, setCustomMod] = useState<CustomMod>({
    category: "",
    type: "",
    brand: "",
    partNumber: "",
    description: "",
    cost: ""
  });

  const categories: string[] = ["exterior", "interior", "drivetrain", "wheels", "suspension", "brakes"];
  
  const getModIdentifier = (mod: Mod): string => {
    // For existing mods with database IDs
    if (mod.id) return `id-${mod.id}`;
    if (mod.modID) return `modID-${mod.modID}`;
    
    const brand = mod.brand || 'unknown';
    const category = mod.category || 'unknown';
    const cost = mod.cost || 0;
    const type = mod.type || 'no-type';
    const partNumber = mod.partNumber || 'no-part';
    const description = (mod.description || '').substring(0, 20);
    
    return `custom-${brand}-${category}-${type}-${partNumber}-${cost}-${description}`.toLowerCase().replace(/\s+/g, '-');
  };
  
  const getFilteredMods = (): Mod[] => {
    let filtered = availableMods;
    console.log(filtered);
    
    
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter(mod => mod.category.toLowerCase() === selectedCategory);
    }
    
    filtered = filtered.filter(mod => mod.isCustom === true)
    
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(mod => 
        mod.brand.toLowerCase().includes(searchLower) ||
        mod.description.toLowerCase().includes(searchLower) ||
        mod.type?.toLowerCase().includes(searchLower) ||
        mod.partNumber?.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  };

  const addCustomMod = (): void => {
    if (!customMod.brand || !customMod.category || !customMod.cost) return;
    
    
    const newMod: Mod = {
      brand: customMod.brand,
      cost: parseFloat(customMod.cost) || 0,
      description: customMod.description,
      category: customMod.category,
      link: "",
      type: customMod.type,
      partNumber: customMod.partNumber,
      isCustom: true
    };
    
    onAddMod(newMod);
    setCustomMod({
      category: "",
      type: "",
      brand: "",
      partNumber: "",
      description: "",
      cost: ""
    });
    setShowCustomForm(false);
  };


  const filteredMods: Mod[] = getFilteredMods();

  return (
    <div className="space-y-6 py-4">
      <DialogHeader>
        <DialogTitle className="text-xl text-white">Modifications</DialogTitle>
        <DialogDescription>Browse and add modifications to your car</DialogDescription>
      </DialogHeader>

      {/* Search and Filter Controls */}
      <div className="flex gap-4 items-end">
        <div className="flex-1">
          <Label htmlFor="search" className="text-white">Search Modifications</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Search by brand, description, type, or part number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="category-filter" className="text-white">Category</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => setShowCustomForm(!showCustomForm)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Custom Mod
        </Button>
      </div>

      {/* Custom Mod Form */}
      {showCustomForm && (
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <h3 className="text-white font-medium mb-4">Add Custom Modification</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label className="text-white">Category *</Label>
              <Select 
                value={customMod.category} 
                onValueChange={(value) => setCustomMod({...customMod, category: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-white">Brand *</Label>
              <Input
                placeholder="e.g. Pandem, HKS, BC Racing"
                value={customMod.brand}
                onChange={(e) => setCustomMod({...customMod, brand: e.target.value})}
              />
            </div>

            <div>
              <Label className="text-white">Type</Label>
              <Input
                placeholder="e.g. Widebody Kit, Turbocharger"
                value={customMod.type}
                onChange={(e) => setCustomMod({...customMod, type: e.target.value})}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label className="text-white">Part Number</Label>
              <Input
                placeholder="e.g. GTR-001, TK-V1"
                value={customMod.partNumber}
                onChange={(e) => setCustomMod({...customMod, partNumber: e.target.value})}
              />
            </div>
            
            <div>
              <Label className="text-white">Cost *</Label>
              <Input
                type="number"
                placeholder="0"
                value={customMod.cost}
                onChange={(e) => setCustomMod({...customMod, cost: e.target.value})}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <Label className="text-white">Description</Label>
            <Textarea
              placeholder="Describe the modification and its benefits..."
              value={customMod.description}
              onChange={(e) => setCustomMod({...customMod, description: e.target.value})}
              className="min-h-[80px]"
            />
          </div>
          
          <div className="flex gap-2">
            <Button onClick={addCustomMod} disabled={!customMod.brand || !customMod.category || !customMod.cost}>
              Add Modification
            </Button>
            <Button variant="outline" onClick={() => setShowCustomForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Modifications Table */}
      <div className="bg-gray-800/30 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="text-left p-4 text-white font-medium">Category</th>
                <th className="text-left p-4 text-white font-medium">Brand</th>
                <th className="text-left p-4 text-white font-medium">Type</th>
                <th className="text-left p-4 text-white font-medium">Description</th>
                <th className="text-left p-4 text-white font-medium">Cost</th>
                <th className="text-left p-4 text-white font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingMods ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-gray-400">Loading modifications...</p>
                  </td>
                </tr>
              ) : filteredMods.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    {searchTerm || selectedCategory !== "all" 
                      ? "No modifications found matching your search criteria"
                      : "No modifications available"
                    }
                  </td>
                </tr>
              ) : (
                filteredMods.map((mod) => {
                  const modIdentifier = getModIdentifier(mod);
                  const isSelected = selectedMods.some(m => getModIdentifier(m) === modIdentifier);
                  return (
                    <tr key={modIdentifier} className="border-t border-gray-700 hover:bg-gray-800/20">
                      <td className="p-4">
                        <Badge variant="outline" className="capitalize text-white">
                          {mod.category}
                          {mod.isCustom && (
                            <span className="ml-1 text-xs text-blue-400">(Custom)</span>
                          )}
                        </Badge>
                      </td>
                      <td className="p-4 text-white font-medium">{mod.brand}</td>
                      <td className="p-4 text-gray-300">{mod.type || '-'}</td>
                      <td className="p-4 text-gray-300 max-w-xs">
                        <div className="truncate" title={mod.description}>
                          {mod.description || '-'}
                        </div>
                      </td>
                      <td className="p-4 text-green-400 font-medium">
                        ${mod.cost.toLocaleString()}
                      </td>
                      <td className="p-4">
                        {isSelected ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onRemoveMod(mod);
                            }}
                            className="flex items-center gap-1"
                            type="button"
                          >
                            <X className="h-3 w-3" />
                            Remove
                          </Button>
                        ) : (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onAddMod(mod);
                            }}
                            className="flex items-center gap-1"
                            type="button"
                          >
                            <Plus className="h-3 w-3" />
                            Add
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Modifications Summary */}
      <div>
        <Label className="block mb-2 text-white">Selected Modifications ({selectedMods.length})</Label>
        <div className="bg-gray-800/50 rounded-lg p-4 min-h-[80px]">
          {selectedMods.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {selectedMods.map(mod => {
                const modIdentifier = getModIdentifier(mod);
                return (
                  <Badge 
                    key={modIdentifier} 
                    variant="secondary" 
                    className="flex items-center gap-2 p-2 h-auto"
                  >
                    <span className="font-medium">{mod.brand}</span>
                    {mod.type && (
                      <>
                        <span className="text-xs text-gray-400">|</span>
                        <span className="text-xs text-gray-400">{mod.type}</span>
                      </>
                    )}
                    <span className="text-xs text-green-400">${mod.cost.toLocaleString()}</span>
                    {mod.isCustom && (
                      <span className="text-xs text-blue-400">(Custom)</span>
                    )}
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemoveMod(mod);
                      }} 
                      className="ml-1 hover:text-red-400"
                      type="button"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-center py-4">No modifications selected yet</p>
          )}
          
          {selectedMods.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-white font-medium">
                Total Cost: <span className="text-green-400">${selectedMods.reduce((sum, mod) => sum + mod.cost, 0).toLocaleString()}</span>
              </p>
            </div>
          )}
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setActiveTab("photos")}>
          Back
        </Button>
        <Button onClick={() => setActiveTab("details")}>
          Next: Add Details
        </Button>
      </DialogFooter>
    </div>
  );
}