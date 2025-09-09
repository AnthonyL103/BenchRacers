import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { Loader2, Plus, X, Search } from "lucide-react";
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
  
  // Cascading filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [partNumber, setPartNumber] = useState<string>("");
  const [descriptionSearch, setDescriptionSearch] = useState<string>("");
  
  // Searchable dropdown states
  const [typeSearch, setTypeSearch] = useState<string>("");
  const [brandSearch, setBrandSearch] = useState<string>("");
  const [showTypeDropdown, setShowTypeDropdown] = useState<boolean>(false);
  const [showBrandDropdown, setShowBrandDropdown] = useState<boolean>(false);
  
  // Custom mod state
  const [showCustomForm, setShowCustomForm] = useState<boolean>(false);
  const [customMod, setCustomMod] = useState<CustomMod>({
    category: "",
    type: "",
    brand: "",
    partNumber: "",
    description: "",
    cost: ""
  });

  const modsCost = selectedMods.reduce((sum, mod) => sum + (mod.cost ?? 0), 0);
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
  
  // Get unique categories from available mods
  const getAvailableCategories = (): string[] => {
    const categoriesSet = new Set<string>();
    availableMods.forEach(mod => {
      if (mod.category && !mod.isCustom) categoriesSet.add(mod.category);
    });
    return Array.from(categoriesSet).sort();
  };

  // Get available types based on selected category
  const getAvailableTypes = (): string[] => {
    if (!selectedCategory) return [];
    const typesSet = new Set<string>();
    availableMods
      .filter(mod => !mod.isCustom && mod.category?.toLowerCase() === selectedCategory.toLowerCase())
      .forEach(mod => {
        if (mod.type) typesSet.add(mod.type);
      });
    return Array.from(typesSet).sort();
  };

  // Get available brands based on selected category and type
  const getAvailableBrands = (): string[] => {
    if (!selectedCategory) return [];
    const brandsSet = new Set<string>();
    availableMods
      .filter(mod => {
        if (mod.isCustom) return false;
        const categoryMatch = mod.category?.toLowerCase() === selectedCategory.toLowerCase();
        const typeMatch = !selectedType || mod.type === selectedType;
        return categoryMatch && typeMatch;
      })
      .forEach(mod => {
        if (mod.brand) brandsSet.add(mod.brand);
      });
    return Array.from(brandsSet).sort();
  };

  // Get filtered types for search dropdown
  const getFilteredTypes = (): string[] => {
    const availableTypes = getAvailableTypes();
    if (!typeSearch.trim()) return availableTypes;
    return availableTypes.filter(type => 
      type.toLowerCase().includes(typeSearch.toLowerCase())
    );
  };

  // Get filtered brands for search dropdown
  const getFilteredBrands = (): string[] => {
    const availableBrands = getAvailableBrands();
    if (!brandSearch.trim()) return availableBrands;
    return availableBrands.filter(brand => 
      brand.toLowerCase().includes(brandSearch.toLowerCase())
    );
  };
  
  // Get filtered mods based on all current selections
  const getFilteredMods = (): Mod[] => {
    let filtered = availableMods.filter(mod => !mod.isCustom);
    
    if (selectedCategory) {
      filtered = filtered.filter(mod => mod.category?.toLowerCase() === selectedCategory.toLowerCase());
    }
    
    if (selectedType) {
      filtered = filtered.filter(mod => mod.type === selectedType);
    }

    if (selectedBrand) {
      filtered = filtered.filter(mod => mod.brand === selectedBrand);
    }

    if (descriptionSearch.trim()) {
      const searchLower = descriptionSearch.toLowerCase();
      filtered = filtered.filter(mod => 
        mod.description?.toLowerCase().includes(searchLower) ||
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

  const resetFilters = () => {
    setSelectedCategory("");
    setSelectedType("");
    setSelectedBrand("");
    setPartNumber("");
    setDescriptionSearch("");
    setTypeSearch("");
    setBrandSearch("");
    setShowTypeDropdown(false);
    setShowBrandDropdown(false);
  };

  const availableCategories = getAvailableCategories();
  const filteredTypes = getFilteredTypes();
  const filteredBrands = getFilteredBrands();
  const filteredMods = getFilteredMods();

  return (
    <div className="space-y-4 py-4">
      <DialogHeader>
        <DialogTitle className="text-xl text-white">Parts / Mods Input</DialogTitle>
        <DialogDescription>Left-to-right cascading selects: Category → Type → Brand → Part# (optional). Description filter below.</DialogDescription>
      </DialogHeader>

      {/* Cascading Filters Form */}
      <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-white text-sm">Category</Label>
            <Select 
              value={selectedCategory} 
              onValueChange={(value) => {
                setSelectedCategory(value);
                setSelectedType("");
                setSelectedBrand("");
                setTypeSearch("");
                setBrandSearch("");
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select..." />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white text-sm">Type</Label>
            <div className="relative mt-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={selectedCategory ? "Search types..." : "Select category first"}
                  value={selectedType || typeSearch}
                  onChange={(e) => {
                    setTypeSearch(e.target.value);
                    setSelectedType("");
                    setShowTypeDropdown(true);
                  }}
                  onFocus={() => setShowTypeDropdown(true)}
                  onBlur={() => setTimeout(() => setShowTypeDropdown(false), 200)}
                  className="pl-10"
                  disabled={!selectedCategory}
                />
              </div>
              {selectedCategory && showTypeDropdown && filteredTypes.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedType(type);
                        setTypeSearch("");
                        setSelectedBrand("");
                        setBrandSearch("");
                        setShowTypeDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 focus:bg-gray-700 focus:outline-none"
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label className="text-white text-sm">Brand</Label>
            <div className="relative mt-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={selectedCategory ? "Search brands..." : "Select category first"}
                  value={selectedBrand || brandSearch}
                  onChange={(e) => {
                    setBrandSearch(e.target.value);
                    setSelectedBrand("");
                    setShowBrandDropdown(true);
                  }}
                  onFocus={() => setShowBrandDropdown(true)}
                  onBlur={() => setTimeout(() => setShowBrandDropdown(false), 200)}
                  className="pl-10"
                  disabled={!selectedCategory}
                />
              </div>
              {selectedCategory && showBrandDropdown && filteredBrands.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {filteredBrands.map(brand => (
                    <button
                      key={brand}
                      onClick={() => {
                        setSelectedBrand(brand);
                        setBrandSearch("");
                        setShowBrandDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700 focus:bg-gray-700 focus:outline-none"
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label className="text-white text-sm">Part # (optional)</Label>
            <Input
              placeholder="e.g., 1K0-615-301AA"
              value={partNumber}
              onChange={(e) => setPartNumber(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Description Search Bar */}
        <div>
          <Label className="text-white text-sm">Description Filter</Label>
          <div className="relative mt-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search descriptions and part numbers..."
              value={descriptionSearch}
              onChange={(e) => setDescriptionSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2 items-center">
          {(selectedCategory || selectedType || selectedBrand || descriptionSearch) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-gray-400 hover:text-white"
            >
              Clear Filters
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomForm(!showCustomForm)}
            className="ml-auto flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {showCustomForm ? 'Cancel Custom' : 'Add Custom Mod'}
          </Button>
        </div>
      </div>

      {/* Custom Mod Form */}
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
                  {availableCategories.map(cat => (
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
              Add Custom Modification
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

      {/* Live Filtered Results */}
      <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-medium">
            Found Mods {filteredMods.length > 0 && `(${filteredMods.length})`}
          </h3>
        </div>
        
        {isLoadingMods ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Loading modifications...</p>
          </div>
        ) : filteredMods.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm">
              {selectedCategory || selectedType || selectedBrand || descriptionSearch
                ? "No mods match your current filters"
                : "Select filters above to browse available mods"
              }
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {filteredMods.map((mod) => {
              const modIdentifier = getModIdentifier(mod);
              const isSelected = selectedMods.some(m => getModIdentifier(m) === modIdentifier);
              return (
                <div key={modIdentifier} className="bg-gray-700/50 rounded-lg p-3 border border-gray-600">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs capitalize text-white">
                          {mod.category}
                        </Badge>
                        <span className="text-white font-medium text-sm">{mod.brand}</span>
                      </div>
                      
                      {mod.type && (
                        <p className="text-gray-300 text-xs mb-1">{mod.type}</p>
                      )}
                      
                      {mod.partNumber && (
                        <p className="text-gray-400 text-xs mb-1">Part #: {mod.partNumber}</p>
                      )}
                      
                      {mod.description && (
                        <p className="text-gray-400 text-xs mb-2 line-clamp-2">{mod.description}</p>
                      )}
                      
                      <span className="text-green-400 font-medium text-sm">
                        ${(mod.cost ?? 0).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onRemoveMod(mod)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => onAddMod(mod)}
                          className="h-8 w-8 p-0"
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

      {/* Current Entries Table */}
      <div className="bg-gray-800/30 rounded-lg border border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-medium">Current Entries ({selectedMods.length})</h3>
            <Button variant="outline" size="sm" className="text-xs">
              Copy Entries as JSON
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-3 text-sm font-medium text-gray-300">Category</th>
                <th className="text-left p-3 text-sm font-medium text-gray-300">Type</th>
                <th className="text-left p-3 text-sm font-medium text-gray-300">Brand</th>
                <th className="text-left p-3 text-sm font-medium text-gray-300">Part #</th>
                <th className="text-left p-3 text-sm font-medium text-gray-300">Description</th>
                <th className="text-left p-3 text-sm font-medium text-gray-300">Cost</th>
                <th className="text-left p-3 text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {selectedMods.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-gray-400 text-sm">
                    No entries yet
                  </td>
                </tr>
              ) : (
                selectedMods.map(mod => {
                  const modIdentifier = getModIdentifier(mod);
                  return (
                    <tr key={modIdentifier} className="border-b border-gray-700/50 hover:bg-gray-700/20">
                      <td className="p-3 text-sm text-gray-300 capitalize">{mod.category}</td>
                      <td className="p-3 text-sm text-gray-300">{mod.type || '-'}</td>
                      <td className="p-3 text-sm text-white font-medium">{mod.brand}</td>
                      <td className="p-3 text-sm text-gray-300">{mod.partNumber || '-'}</td>
                      <td className="p-3 text-sm text-gray-400 max-w-48 truncate">{mod.description || '-'}</td>
                      <td className="p-3 text-sm text-green-400 font-medium">${(mod.cost ?? 0).toLocaleString()}</td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveMod(mod)}
                          className="text-gray-400 hover:text-red-400 h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total Cost Summary */}
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