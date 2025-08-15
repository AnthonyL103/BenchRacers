import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Loader2, Plus, X, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Textarea } from "../ui/textarea";
import { DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Mod } from "../contexts/garagecontext"; 

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
  baseCost?: number; 
}

export function ModsTabContent({ 
  availableMods, 
  selectedMods, 
  onAddMod, 
  onRemoveMod, 
  isLoadingMods,
  setActiveTab,
  baseCost = 0
}: ModsTabContentProps) {
  
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCustomForm, setShowCustomForm] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [customMod, setCustomMod] = useState<CustomMod>({
    category: "",
    type: "",
    brand: "",
    partNumber: "",
    description: "",
    cost: ""
  });

  const categories: string[] = ["exterior", "interior", "drivetrain", "wheels", "suspension", "brakes"];
  
  const modsCost = selectedMods.reduce((sum, mod) => sum + mod.cost, 0);
  const totalCost = baseCost + modsCost;
  
  const getModIdentifier = (mod: Mod): string => {
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
    
    if (selectedCategory !== "all") {
      filtered = filtered.filter(mod => mod.category.toLowerCase() === selectedCategory);
    }
    
    filtered = filtered.filter(mod => !mod.isCustom);

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
    <div className="space-y-4 py-4">
      <DialogHeader>
        <DialogTitle className="text-xl text-white">Modifications</DialogTitle>
        <DialogDescription>Browse and add modifications to your car</DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <div>
          <Label htmlFor="search" className="text-white text-sm">Search Modifications</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="search"
              placeholder="Search mods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 flex-1"
          >
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Filters & Add Custom
          </Button>
        </div>

        {showFilters && (
          <div className="space-y-3 bg-gray-800/30 p-3 rounded-lg border border-gray-700">
            <div>
              <Label htmlFor="category-filter" className="text-white text-sm">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="mt-1">
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
              size="sm"
              className="w-full flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {showCustomForm ? 'Cancel Custom Mod' : 'Add Custom Mod'}
            </Button>
          </div>
        )}
      </div>

      {showCustomForm && (
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 space-y-4">
          <h3 className="text-white font-medium text-lg">Add Custom Modification</h3>
          
          <div className="space-y-3">
            <div>
              <Label className="text-white text-sm">Category *</Label>
              <Select 
                value={customMod.category} 
                onValueChange={(value) => setCustomMod({...customMod, category: value})}
              >
                <SelectTrigger className="mt-1">
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
              <Label className="text-white text-sm">Brand *</Label>
              <Input
                placeholder="e.g. Pandem, HKS, BC Racing"
                value={customMod.brand}
                onChange={(e) => setCustomMod({...customMod, brand: e.target.value})}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-white text-sm">Type</Label>
              <Input
                placeholder="e.g. Widebody Kit, Turbocharger"
                value={customMod.type}
                onChange={(e) => setCustomMod({...customMod, type: e.target.value})}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-white text-sm">Part Number</Label>
              <Input
                placeholder="e.g. GTR-001, TK-V1"
                value={customMod.partNumber}
                onChange={(e) => setCustomMod({...customMod, partNumber: e.target.value})}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-white text-sm">Cost *</Label>
              <Input
                type="number"
                placeholder="0"
                value={customMod.cost}
                onChange={(e) => setCustomMod({...customMod, cost: e.target.value})}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-white text-sm">Description</Label>
              <Textarea
                placeholder="Describe the modification and its benefits..."
                value={customMod.description}
                onChange={(e) => setCustomMod({...customMod, description: e.target.value})}
                className="min-h-[80px] mt-1"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={addCustomMod} 
              disabled={!customMod.brand || !customMod.category || !customMod.cost}
              className="flex-1"
              size="sm"
            >
              Add Modification
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowCustomForm(false)}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {isLoadingMods ? (
          <div className="bg-gray-800/30 rounded-lg p-6 text-center">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Loading modifications...</p>
          </div>
        ) : filteredMods.length === 0 ? (
          <div className="bg-gray-800/30 rounded-lg p-6 text-center">
            <p className="text-gray-400 text-sm">
              {searchTerm || selectedCategory !== "all" 
                ? "No modifications found matching your search criteria"
                : "No modifications available"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMods.map((mod) => {
              const modIdentifier = getModIdentifier(mod);
              const isSelected = selectedMods.some(m => getModIdentifier(m) === modIdentifier);
              return (
                <div key={modIdentifier} className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs capitalize text-white">
                          {mod.category}
                        </Badge>
                      </div>
                      
                      <h4 className="text-white font-medium text-sm mb-1">{mod.brand}</h4>
                      
                      {mod.type && (
                        <p className="text-gray-300 text-xs mb-1">{mod.type}</p>
                      )}
                      
                      {mod.description && (
                        <p className="text-gray-400 text-xs line-clamp-2 mb-2">{mod.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-green-400 font-medium text-sm">
                          ${mod.cost.toLocaleString()}
                        </span>
                        
                       
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onRemoveMod(mod);
                          }}
                          className="h-8 w-8 p-0"
                          type="button"
                        >
                          <X className="h-4 w-4" />
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
                          className="h-8 w-8 p-0"
                          type="button"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedMods.length > 0 && (
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-white text-sm font-medium">
              Selected ({selectedMods.length})
            </Label>
            <span className="text-green-400 font-medium text-sm">
              ${modsCost.toLocaleString()}
            </span>
          </div>
          
          <div className="space-y-2">
            {selectedMods.map(mod => {
              const modIdentifier = getModIdentifier(mod);
              return (
                <div key={modIdentifier} className="flex items-center justify-between bg-gray-700/50 rounded p-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm font-medium truncate">{mod.brand}</span>
                      {mod.type && (
                        <span className="text-gray-400 text-xs">• {mod.type}</span>
                      )}
                      {mod.isCustom && (
                        <Badge variant="outline" className="text-xs text-blue-400">Custom</Badge>
                      )}
                    </div>
                    <span className="text-green-400 text-xs">${mod.cost.toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRemoveMod(mod);
                    }} 
                    className="ml-2 text-gray-400 hover:text-red-400 p-1"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium">Total Build Cost</h3>
            <p className="text-sm text-gray-400">
              Base: ${baseCost.toLocaleString()} + Mods: ${modsCost.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-green-400">
              ${totalCost.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">
              {selectedMods.length} modification{selectedMods.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <DialogFooter className="flex-col sm:flex-row gap-2">
        <Button variant="outline" onClick={() => setActiveTab("photos")} className="w-full sm:w-auto">
          Back
        </Button>
        <Button onClick={() => setActiveTab("details")} className="w-full sm:w-auto">
          Next: Add Details
        </Button>
      </DialogFooter>
    </div>
  );
}