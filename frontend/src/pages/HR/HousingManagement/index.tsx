import React, { useState, useEffect } from "react";
import { Link } from "react-router";
import { Plus, Home, Trash, X, Search, Users, Bed, Table, Edit, Save, XCircle, Check } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { House, Resident, Landlord, Facility, Car } from "./mockData";
import api from "../../../api";

const HousingManagement: React.FC = () => {
  // Core state
  const [houses, setHouses] = useState<House[]>([]);
  const [selectedHouse, setSelectedHouse] = useState<House | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showAddHouseModal, setShowAddHouseModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [houseToDelete, setHouseToDelete] = useState<string | null>(null);
  const [showAddResidentModal, setShowAddResidentModal] = useState<boolean>(false);

  // Edit mode states
  const [isEditingAddress, setIsEditingAddress] = useState<boolean>(false);
  const [isEditingLandlord, setIsEditingLandlord] = useState<boolean>(false);
  const [isEditingFacility, setIsEditingFacility] = useState<boolean>(false);
  const [isEditingResident, setIsEditingResident] = useState<string | null>(null);

  // Edit form states
  const [editAddress, setEditAddress] = useState<House["address"]>({ 
    street: "", city: "", state: "", zip: "" 
  });
  const [editLandlord, setEditLandlord] = useState<Landlord>({ 
    name: "", phone: "", email: "" 
  });
  const [editFacility, setEditFacility] = useState<Facility>({ 
    beds: 0, mattresses: 0, tables: 0, chairs: 0 
  });
  const [editResident, setEditResident] = useState<Resident>({
    id: "",
    employeeId: "",
    name: "",
    phone: "",
    email: ""
  });

  // New house form state
  const [newHouse, setNewHouse] = useState<Omit<House, "id" | "residents">>({
    address: { street: "", city: "", state: "", zip: "" },
    landlord: { name: "", phone: "", email: "" },
    facility: { beds: 0, mattresses: 0, tables: 0, chairs: 0 }
  });

  // New resident form state
  const [newResident, setNewResident] = useState<Omit<Resident, "id">>({
    employeeId: "",
    name: "",
    phone: "",
    email: ""
  });

  // Fetch houses from API
  useEffect(() => {
    const fetchHouses = async () => {
      try {
        setLoading(true);
        // 获取存储在localStorage中的JWT令牌
        const token = localStorage.getItem('token');
        
        // 添加Authorization头到请求中
        const response = await api.get('/hr/house', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Transform backend data to match frontend structure
        const transformedHouses: House[] = response.data.map((house: any) => ({
          id: house._id,
          address: {
            // Split address string into components or use as is
            street: house.address || '',
            city: '',
            state: '',
            zip: ''
          },
          landlord: {
            name: house.landLord?.fullName || '',
            phone: house.landLord?.phone || '',
            email: house.landLord?.email || ''
          },
          facility: {
            beds: house.bed || 0,
            mattresses: house.mattress || 0,
            tables: house.table || 0,
            chairs: house.chair || 0
          },
          residents: house.employeeId?.map((employee: any) => ({
            id: employee._id,
            employeeId: employee._id,
            name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
            phone: employee.phone || '',
            email: employee.email || '',
            car: employee.car ? {
              make: employee.car.make || '',
              model: employee.car.model || '',
              color: employee.car.color || '',
              licensePlate: ''
            } : undefined
          })) || []
        }));
        
        setHouses(transformedHouses);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching houses:', err);
        setError('Failed to load houses. Please try again later.');
        setLoading(false);
      }
    };

    fetchHouses();
  }, []);

  // Initialize edit forms when selected house changes
  useEffect(() => {
    if (selectedHouse) {
      setEditAddress({ ...selectedHouse.address });
      setEditLandlord({ ...selectedHouse.landlord });
      setEditFacility({ ...selectedHouse.facility });
    }
  }, [selectedHouse]);

  // House selection
  const handleSelectHouse = (house: House) => {
    setSelectedHouse(house);
    // Reset all edit modes
    setIsEditingAddress(false);
    setIsEditingLandlord(false);
    setIsEditingFacility(false);
    setIsEditingResident(null);
  };

  // Generic house update function
  const updateHouse = async (updatedHouse: House) => {
    try {
      // Transform frontend data to match backend structure
      const backendHouse = {
        address: `${updatedHouse.address.street}, ${updatedHouse.address.city}, ${updatedHouse.address.state} ${updatedHouse.address.zip}`,
        landLord: {
          fullName: updatedHouse.landlord.name,
          phone: updatedHouse.landlord.phone,
          email: updatedHouse.landlord.email
        },
        bed: updatedHouse.facility.beds,
        mattress: updatedHouse.facility.mattresses,
        table: updatedHouse.facility.tables,
        chair: updatedHouse.facility.chairs
      };
      
      // Update in backend
      await api.put(`/hr/house/${updatedHouse.id}`, backendHouse);
      
      // Update local state
      const updatedHouses = houses.map(house => 
        house.id === updatedHouse.id ? updatedHouse : house
      );
      setHouses(updatedHouses);
      setSelectedHouse(updatedHouse);
    } catch (err) {
      console.error('Error updating house:', err);
      setError('Failed to update house. Please try again later.');
    }
  };

  // Address editing
  const handleStartEditAddress = () => {
    if (!selectedHouse) return;
    setEditAddress({ ...selectedHouse.address });
    setIsEditingAddress(true);
  };

  const handleSaveAddress = () => {
    if (!selectedHouse) return;
    const updatedHouse = {
      ...selectedHouse,
      address: editAddress
    };
    updateHouse(updatedHouse);
    setIsEditingAddress(false);
  };

  // Landlord editing
  const handleStartEditLandlord = () => {
    if (!selectedHouse) return;
    setEditLandlord({ ...selectedHouse.landlord });
    setIsEditingLandlord(true);
  };

  const handleSaveLandlord = () => {
    if (!selectedHouse) return;
    const updatedHouse = {
      ...selectedHouse,
      landlord: editLandlord
    };
    updateHouse(updatedHouse);
    setIsEditingLandlord(false);
  };

  // Facility editing
  const handleStartEditFacility = () => {
    if (!selectedHouse) return;
    setEditFacility({ ...selectedHouse.facility });
    setIsEditingFacility(true);
  };

  const handleSaveFacility = () => {
    if (!selectedHouse) return;
    const updatedHouse = {
      ...selectedHouse,
      facility: editFacility
    };
    updateHouse(updatedHouse);
    setIsEditingFacility(false);
  };

  // Resident editing
  const handleStartEditResident = (residentId: string) => {
    if (!selectedHouse) return;
    const resident = selectedHouse.residents.find(r => r.id === residentId);
    if (resident) {
      setEditResident({ ...resident });
      setIsEditingResident(residentId);
    }
  };

  const handleSaveResident = () => {
    if (!selectedHouse || !isEditingResident) return;
    const updatedResidents = selectedHouse.residents.map(resident => 
      resident.id === isEditingResident ? editResident : resident
    );
    const updatedHouse = {
      ...selectedHouse,
      residents: updatedResidents
    };
    updateHouse(updatedHouse);
    setIsEditingResident(null);
  };

  // Add new house
  const handleAddHouse = async () => {
    try {
      // Transform to backend format
      const backendHouse = {
        address: `${newHouse.address.street}, ${newHouse.address.city}, ${newHouse.address.state} ${newHouse.address.zip}`,
        landLord: {
          fullName: newHouse.landlord.name,
          phone: newHouse.landlord.phone,
          email: newHouse.landlord.email
        },
        bed: newHouse.facility.beds,
        mattress: newHouse.facility.mattresses,
        table: newHouse.facility.tables,
        chair: newHouse.facility.chairs,
        employeeId: []
      };
      
      const response = await api.post('/hr/house', backendHouse);
      
      // Transform response to frontend format
      const addedHouse: House = {
        id: response.data.house._id,
        address: {
          street: newHouse.address.street,
          city: newHouse.address.city,
          state: newHouse.address.state,
          zip: newHouse.address.zip
        },
        landlord: {
          name: newHouse.landlord.name,
          phone: newHouse.landlord.phone,
          email: newHouse.landlord.email
        },
        facility: {
          beds: newHouse.facility.beds,
          mattresses: newHouse.facility.mattresses,
          tables: newHouse.facility.tables,
          chairs: newHouse.facility.chairs
        },
        residents: []
      };
      
      setHouses([...houses, addedHouse]);
      setShowAddHouseModal(false);
      
      // Reset new house form
      setNewHouse({
        address: { street: "", city: "", state: "", zip: "" },
        landlord: { name: "", phone: "", email: "" },
        facility: { beds: 0, mattresses: 0, tables: 0, chairs: 0 }
      });
    } catch (err) {
      console.error('Error adding house:', err);
      setError('Failed to add house. Please try again later.');
    }
  };

  // Delete house
  const handleConfirmDeleteHouse = (houseId: string) => {
    setHouseToDelete(houseId);
    setShowDeleteModal(true);
  };

  const handleDeleteHouse = async () => {
    if (!houseToDelete) return;
    
    try {
      await api.delete(`/hr/house/${houseToDelete}`);
      
      const updatedHouses = houses.filter(house => house.id !== houseToDelete);
      setHouses(updatedHouses);
      
      if (selectedHouse && selectedHouse.id === houseToDelete) {
        setSelectedHouse(null);
      }
      
      setShowDeleteModal(false);
      setHouseToDelete(null);
    } catch (err) {
      console.error('Error deleting house:', err);
      setError('Failed to delete house. Please try again later.');
    }
  };

  // Add new resident
  const handleAddResident = async () => {
    if (!selectedHouse) return;
    
    try {
      // Call assign-house API
      await api.post('/hr/assign-house', {
        employeeId: newResident.employeeId,
        houseId: selectedHouse.id
      });
      
      // Create new resident object
      const resident: Resident = {
        id: uuidv4(), // We'll use a temporary ID until we refresh data
        employeeId: newResident.employeeId,
        name: newResident.name,
        phone: newResident.phone,
        email: newResident.email
      };
      
      // Update local state
      const updatedHouse = {
        ...selectedHouse,
        residents: [...selectedHouse.residents, resident]
      };
      
      updateHouse(updatedHouse);
      setShowAddResidentModal(false);
      
      // Reset form
      setNewResident({
        employeeId: "",
        name: "",
        phone: "",
        email: ""
      });
    } catch (err) {
      console.error('Error adding resident:', err);
      setError('Failed to add resident. Please try again later.');
    }
  };

  // Delete resident
  const handleDeleteResident = (residentId: string) => {
    if (!selectedHouse) return;
    const updatedResidents = selectedHouse.residents.filter(
      resident => resident.id !== residentId
    );
    const updatedHouse = {
      ...selectedHouse,
      residents: updatedResidents
    };
    updateHouse(updatedHouse);
  };

  // Cancel edits
  const handleCancelEdit = (editType: 'address' | 'landlord' | 'facility' | 'resident') => {
    switch (editType) {
      case 'address':
        setIsEditingAddress(false);
        if (selectedHouse) setEditAddress(selectedHouse.address);
        break;
      case 'landlord':
        setIsEditingLandlord(false);
        if (selectedHouse) setEditLandlord(selectedHouse.landlord);
        break;
      case 'facility':
        setIsEditingFacility(false);
        if (selectedHouse) setEditFacility(selectedHouse.facility);
        break;
      case 'resident':
        setIsEditingResident(null);
        break;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Housing Management</h1>
      
      {/* Search and Add House */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search houses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
        <button
          onClick={() => setShowAddHouseModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
        >
          <Plus size={18} /> Add House
        </button>
      </div>

      <div className="flex gap-6">
        {/* House List */}
        <div className="w-1/3 bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-medium text-lg">Houses ({houses.length})</h2>
          </div>
          <div className="overflow-y-auto max-h-[70vh]">
            {houses.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {houses.map(house => (
                  <li 
                    key={house.id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 ${selectedHouse?.id === house.id ? 'bg-indigo-50' : ''}`}
                    onClick={() => handleSelectHouse(house)}
                  >
                    <div className="font-medium">{house.address.street}</div>
                    <div className="text-sm text-gray-500">
                      {house.address.city}, {house.address.state} {house.address.zip}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      <span className="inline-flex items-center gap-1">
                        <Users size={14} /> {house.residents.length} residents
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No houses found
              </div>
            )}
          </div>
        </div>

        {/* House Details */}
        {selectedHouse ? (
          <div className="w-2/3 bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6">
              {/* Address Section */}
              <div className="mb-6">
                <div className="flex justify-between items-start mb-2">
                  {isEditingAddress ? (
                    <div className="w-full">
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                        <input
                          type="text"
                          value={editAddress.street}
                          onChange={(e) => setEditAddress({...editAddress, street: e.target.value})}
                          className="w-full border rounded-md px-3 py-2"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                          <input
                            type="text"
                            value={editAddress.city}
                            onChange={(e) => setEditAddress({...editAddress, city: e.target.value})}
                            className="w-full border rounded-md px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                          <input
                            type="text"
                            value={editAddress.state}
                            onChange={(e) => setEditAddress({...editAddress, state: e.target.value})}
                            className="w-full border rounded-md px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
                          <input
                            type="text"
                            value={editAddress.zip}
                            onChange={(e) => setEditAddress({...editAddress, zip: e.target.value})}
                            className="w-full border rounded-md px-3 py-2"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <button
                          onClick={handleSaveAddress}
                          className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1"
                        >
                          <Save size={14} /> Save
                        </button>
                        <button
                          onClick={() => handleCancelEdit('address')}
                          className="border border-gray-300 px-3 py-1 rounded-md text-sm flex items-center gap-1"
                        >
                          <X size={14} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h2 className="text-xl font-bold">{selectedHouse.address.street}</h2>
                        <p className="text-gray-600">
                          {selectedHouse.address.city}, {selectedHouse.address.state} {selectedHouse.address.zip}
                        </p>
                      </div>
                      <button
                        onClick={handleStartEditAddress}
                        className="text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <Edit size={16} /> Edit
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                {/* Landlord Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Landlord Information</h3>
                    {!isEditingLandlord && (
                      <button
                        onClick={handleStartEditLandlord}
                        className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
                      >
                        <Edit size={14} /> Edit
                      </button>
                    )}
                  </div>
                  
                  {isEditingLandlord ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <input
                          type="text"
                          value={editLandlord.name}
                          onChange={(e) => setEditLandlord({...editLandlord, name: e.target.value})}
                          className="w-full border rounded-md px-3 py-2"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="text"
                          value={editLandlord.phone}
                          onChange={(e) => setEditLandlord({...editLandlord, phone: e.target.value})}
                          className="w-full border rounded-md px-3 py-2"
                        />
                      </div>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={editLandlord.email}
                          onChange={(e) => setEditLandlord({...editLandlord, email: e.target.value})}
                          className="w-full border rounded-md px-3 py-2"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveLandlord}
                          className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1"
                        >
                          <Save size={14} /> Save
                        </button>
                        <button
                          onClick={() => handleCancelEdit('landlord')}
                          className="border border-gray-300 px-3 py-1 rounded-md text-sm flex items-center gap-1"
                        >
                          <X size={14} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium">{selectedHouse.landlord.name}</p>
                      <p className="text-sm text-gray-500 text-sm mt-1">Phone: {selectedHouse.landlord.phone}</p>
                      <p className="text-sm text-gray-500">Email: {selectedHouse.landlord.email}</p>
                    </div>
                  )}
                </div>

                {/* Facility Section */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Facility Information</h3>
                    {!isEditingFacility && (
                      <button
                        onClick={handleStartEditFacility}
                        className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
                      >
                        <Edit size={14} /> Edit
                      </button>
                    )}
                  </div>
                  
                  {isEditingFacility ? (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Beds</label>
                          <input
                            type="number"
                            min="0"
                            value={editFacility.beds}
                            onChange={(e) => setEditFacility({...editFacility, beds: parseInt(e.target.value) || 0})}
                            className="w-full border rounded-md px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mattresses</label>
                          <input
                            type="number"
                            min="0"
                            value={editFacility.mattresses}
                            onChange={(e) => setEditFacility({...editFacility, mattresses: parseInt(e.target.value) || 0})}
                            className="w-full border rounded-md px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tables</label>
                          <input
                            type="number"
                            min="0"
                            value={editFacility.tables}
                            onChange={(e) => setEditFacility({...editFacility, tables: parseInt(e.target.value) || 0})}
                            className="w-full border rounded-md px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Chairs</label>
                          <input
                            type="number"
                            min="0"
                            value={editFacility.chairs}
                            onChange={(e) => setEditFacility({...editFacility, chairs: parseInt(e.target.value) || 0})}
                            className="w-full border rounded-md px-3 py-2"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-3">
                        <button
                          onClick={handleSaveFacility}
                          className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1"
                        >
                          <Save size={14} /> Save
                        </button>
                        <button
                          onClick={() => handleCancelEdit('facility')}
                          className="border border-gray-300 px-3 py-1 rounded-md text-sm flex items-center gap-1"
                        >
                          <X size={14} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center gap-2">
                          <Bed size={16} className="text-indigo-600" />
                          <span>{selectedHouse.facility.beds} Beds</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Bed size={16} className="text-indigo-600" />
                          <span>{selectedHouse.facility.mattresses} Mattresses</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Table size={16} className="text-indigo-600" />
                          <span>{selectedHouse.facility.tables} Tables</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users size={16} className="text-indigo-600" />
                          <span>{selectedHouse.facility.chairs} Chairs</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Residents Section */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-medium">Residents ({selectedHouse.residents.length})</h3>
                  <button
                    onClick={() => setShowAddResidentModal(true)}
                    className="bg-indigo-600 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1"
                  >
                    <Plus size={14} /> Add Resident
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Employee ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Car
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedHouse.residents.map(resident => (
                        <tr key={resident.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditingResident === resident.id ? (
                              <input
                                type="text"
                                value={editResident.name}
                                onChange={(e) => setEditResident({...editResident, name: e.target.value})}
                                className="border rounded-md px-2 py-1 w-full"
                              />
                            ) : (
                              <div className="font-medium text-gray-900">{resident.name}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditingResident === resident.id ? (
                              <input
                                type="text"
                                value={editResident.employeeId}
                                onChange={(e) => setEditResident({...editResident, employeeId: e.target.value})}
                                className="border rounded-md px-2 py-1 w-full"
                              />
                            ) : (
                              <div className="text-sm text-gray-500">{resident.employeeId}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditingResident === resident.id ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={editResident.phone}
                                  onChange={(e) => setEditResident({...editResident, phone: e.target.value})}
                                  className="border rounded-md px-2 py-1 w-full"
                                  placeholder="Phone"
                                />
                                <input
                                  type="email"
                                  value={editResident.email}
                                  onChange={(e) => setEditResident({...editResident, email: e.target.value})}
                                  className="border rounded-md px-2 py-1 w-full"
                                  placeholder="Email"
                                />
                              </div>
                            ) : (
                              <div>
                                <div className="text-sm text-gray-500">{resident.phone}</div>
                                <div className="text-sm text-gray-500">{resident.email}</div>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isEditingResident === resident.id ? (
                              <div className="text-sm text-gray-500">
                                <span>Car information cannot be edited</span>
                              </div>
                            ) : resident.car ? (
                              <div className="text-sm text-gray-500">
                                {resident.car.make} {resident.car.model}, {resident.car.color}
                                <div>{resident.car.licensePlate}</div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">No car</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {isEditingResident === resident.id ? (
                              <div className="flex justify-end space-x-2">
                                <button
                                  onClick={handleSaveResident}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => handleCancelEdit('resident')}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end space-x-3">
                                <button
                                  onClick={() => handleStartEditResident(resident.id)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteResident(resident.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {selectedHouse.residents.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            No residents
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-2/3 bg-white rounded-lg shadow flex items-center justify-center p-12">
            <div className="text-center">
              <Home size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No House Selected</h3>
              <p className="text-gray-500">Select a house from the list or add a new one</p>
            </div>
          </div>
        )}
      </div>

      {/* Add House Modal */}
      {showAddHouseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New House</h2>
              <button
                onClick={() => setShowAddHouseModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium mb-2">Address</h3>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Street</label>
                <input
                  type="text"
                  value={newHouse.address.street}
                  onChange={(e) => setNewHouse({
                    ...newHouse,
                    address: { ...newHouse.address, street: e.target.value }
                  })}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={newHouse.address.city}
                    onChange={(e) => setNewHouse({
                      ...newHouse,
                      address: { ...newHouse.address, city: e.target.value }
                    })}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={newHouse.address.state}
                    onChange={(e) => setNewHouse({
                      ...newHouse,
                      address: { ...newHouse.address, state: e.target.value }
                    })}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
                  <input
                    type="text"
                    value={newHouse.address.zip}
                    onChange={(e) => setNewHouse({
                      ...newHouse,
                      address: { ...newHouse.address, zip: e.target.value }
                    })}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium mb-2">Landlord Information</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newHouse.landlord.name}
                    onChange={(e) => setNewHouse({
                      ...newHouse,
                      landlord: { ...newHouse.landlord, name: e.target.value }
                    })}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={newHouse.landlord.phone}
                    onChange={(e) => setNewHouse({
                      ...newHouse,
                      landlord: { ...newHouse.landlord, phone: e.target.value }
                    })}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newHouse.landlord.email}
                    onChange={(e) => setNewHouse({
                      ...newHouse,
                      landlord: { ...newHouse.landlord, email: e.target.value }
                    })}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="font-medium mb-2">Facility Information</h3>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Beds</label>
                  <input
                    type="number"
                    min="0"
                    value={newHouse.facility.beds}
                    onChange={(e) => setNewHouse({
                      ...newHouse,
                      facility: { ...newHouse.facility, beds: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mattresses</label>
                  <input
                    type="number"
                    min="0"
                    value={newHouse.facility.mattresses}
                    onChange={(e) => setNewHouse({
                      ...newHouse,
                      facility: { ...newHouse.facility, mattresses: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tables</label>
                  <input
                    type="number"
                    min="0"
                    value={newHouse.facility.tables}
                    onChange={(e) => setNewHouse({
                      ...newHouse,
                      facility: { ...newHouse.facility, tables: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Chairs</label>
                  <input
                    type="number"
                    min="0"
                    value={newHouse.facility.chairs}
                    onChange={(e) => setNewHouse({
                      ...newHouse,
                      facility: { ...newHouse.facility, chairs: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAddHouseModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddHouse}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Add House
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Resident Modal */}
      {showAddResidentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Resident</h2>
              <button
                onClick={() => setShowAddResidentModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="mb-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newResident.name}
                  onChange={(e) => setNewResident({...newResident, name: e.target.value})}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input
                  type="text"
                  value={newResident.employeeId}
                  onChange={(e) => setNewResident({...newResident, employeeId: e.target.value})}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={newResident.phone}
                  onChange={(e) => setNewResident({...newResident, phone: e.target.value})}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newResident.email}
                  onChange={(e) => setNewResident({...newResident, email: e.target.value})}
                  className="w-full border rounded-md px-3 py-2"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAddResidentModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddResident}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Add Resident
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Confirm Deletion</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            
            <p className="mb-6">Are you sure you want to delete this house? This action cannot be undone.</p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteHouse}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete House
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading and Error States */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">Loading houses...</div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {!loading && !error && houses.length === 0 && (
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600">No houses found. Add a new house to get started.</div>
        </div>
      )}
    </div>
  );
};

export default HousingManagement;