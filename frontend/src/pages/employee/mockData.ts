import { Employee, Shift, Leave, Salary, Stats } from '../EmployeeManagement';

// Diverse, high-quality professional portraits from Unsplash
export const AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80', // Female
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80', // Male
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80', // Female
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80', // Male
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&h=150&q=80', // Female
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80', // Male
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80', // Female
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&h=150&q=80', // Male
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=150&h=150&q=80', // Female
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150&q=80', // Male
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80', // Female
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&h=150&q=80', // Male
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&h=150&q=80', // Female
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80', // Male
  'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=150&h=150&q=80', // Female
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=150&h=150&q=80', // Male
  'https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=150&h=150&q=80', // Female
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&h=150&q=80', // Female
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=150&h=150&q=80', // Female
  'https://images.unsplash.com/photo-1489980508314-941910ded1f4?auto=format&fit=crop&w=150&h=150&q=80', // Male
];

export const MOCK_SHIFTS: Shift[] = [
  { id: 's1', name: 'Morning', startTime: '07:00 AM', endTime: '03:00 PM', breakTime: '30 mins', applicableRoles: ['Waiter', 'Chef', 'Cashier', 'Kitchen Staff', 'Housekeeping'], restaurantId: 'mock-id' },
  { id: 's2', name: 'Evening', startTime: '03:00 PM', endTime: '11:00 PM', breakTime: '45 mins', applicableRoles: ['Waiter', 'Chef', 'Cashier', 'Kitchen Staff', 'Security'], restaurantId: 'mock-id' },
  { id: 's3', name: 'Night', startTime: '11:00 PM', endTime: '07:00 AM', breakTime: '1 hour', applicableRoles: ['Security', 'Cleaner', 'Kitchen Staff'], restaurantId: 'mock-id' },
  { id: 's4', name: 'General', startTime: '09:00 AM', endTime: '06:00 PM', breakTime: '1 hour', applicableRoles: ['Manager', 'Admin', 'Inventory Manager', 'Billing Executive'], restaurantId: 'mock-id' },
  { id: 's5', name: 'Mid-Day Split', startTime: '11:00 AM', endTime: '09:00 PM', breakTime: '2 hours', applicableRoles: ['Waiter', 'Chef', 'Sous Chef'], restaurantId: 'mock-id' }
];

export const generateMockEmployees = (): Employee[] => {
  const list: Employee[] = [
    // 1. Management (Admins & Managers)
    {
      id: 'emp-1',
      employeeId: 'EMP-1001',
      name: 'Vikram Malhotra',
      phone: '9876543210',
      email: 'vikram.m@diner.com',
      department: 'Management',
      role: 'Manager',
      joiningDate: '2023-01-15',
      shift: 'General',
      employmentType: 'Full-time',
      salary: 95000,
      status: 'Active',
      notes: 'General Restaurant Operations Director. Manages all service and front-of-house teams.',
      createdAt: '2023-01-15T08:00:00Z',
      photo: AVATARS[9],
    },
    {
      id: 'emp-2',
      employeeId: 'EMP-1002',
      name: 'Vikas Khanna',
      phone: '9820123456',
      email: 'chef.vikas@diner.com',
      department: 'Kitchen',
      role: 'Head Chef',
      joiningDate: '2023-02-10',
      shift: 'General',
      employmentType: 'Full-time',
      salary: 120000,
      status: 'Active',
      notes: 'Executive Chef. Responsible for menu engineering, culinary standards, and kitchen inventory control.',
      createdAt: '2023-02-10T08:00:00Z',
      photo: AVATARS[1],
    },
    {
      id: 'emp-3',
      employeeId: 'EMP-1003',
      name: 'Ananya Roy',
      phone: '9819876543',
      email: 'ananya.roy@diner.com',
      department: 'Management',
      role: 'Assistant Manager',
      joiningDate: '2023-06-01',
      shift: 'Evening',
      employmentType: 'Full-time',
      salary: 70000,
      status: 'Active',
      notes: 'Handles floor management, customer relations, and evening cash register reconciliation.',
      createdAt: '2023-06-01T08:00:00Z',
      photo: AVATARS[2],
    },

    // 2. Kitchen Staff (Chefs, Sous Chefs, Helpers)
    {
      id: 'emp-4',
      employeeId: 'EMP-1004',
      name: 'Ranveer Brar',
      phone: '9833445566',
      email: 'ranveer.b@diner.com',
      department: 'Kitchen',
      role: 'Sous Chef',
      joiningDate: '2023-04-12',
      shift: 'Mid-Day Split',
      employmentType: 'Full-time',
      salary: 85000,
      status: 'Active',
      notes: 'Specializes in Indian Main Courses and tandoor management.',
      createdAt: '2023-04-12T08:00:00Z',
      photo: AVATARS[3],
    },
    {
      id: 'emp-5',
      employeeId: 'EMP-1005',
      name: 'Pooja Dhingra',
      phone: '9892112233',
      email: 'pooja.d@diner.com',
      department: 'Kitchen',
      role: 'Chef',
      joiningDate: '2023-09-01',
      shift: 'Morning',
      employmentType: 'Full-time',
      salary: 60000,
      status: 'Active',
      notes: 'Pastry Chef. Manages the dessert section, bakery orders, and sweet inventory.',
      createdAt: '2023-09-01T08:00:00Z',
      photo: AVATARS[4],
    },
    {
      id: 'emp-6',
      employeeId: 'EMP-1006',
      name: 'Karan Veer',
      phone: '9811223344',
      email: 'karan.v@diner.com',
      department: 'Kitchen',
      role: 'Kitchen Staff',
      joiningDate: '2024-01-10',
      shift: 'Morning',
      employmentType: 'Full-time',
      salary: 32000,
      status: 'Active',
      notes: 'Line Cook. Handles appetizers, salads, and fast-food station.',
      createdAt: '2024-01-10T08:00:00Z',
      photo: AVATARS[5],
    },
    {
      id: 'emp-7',
      employeeId: 'EMP-1007',
      name: 'Meera Sen',
      phone: '9822334455',
      email: 'meera.s@diner.com',
      department: 'Kitchen',
      role: 'Kitchen Staff',
      joiningDate: '2024-01-15',
      shift: 'Evening',
      employmentType: 'Full-time',
      salary: 32000,
      status: 'Active',
      notes: 'Line Cook. Handles pan-Asian, pasta station, and main course preps.',
      createdAt: '2024-01-15T08:00:00Z',
      photo: AVATARS[6],
    },
    {
      id: 'emp-8',
      employeeId: 'EMP-1008',
      name: 'Ramesh Kumar',
      phone: '9833556677',
      email: null,
      department: 'Kitchen',
      role: 'Helper',
      joiningDate: '2024-02-01',
      shift: 'Morning',
      employmentType: 'Full-time',
      salary: 22000,
      status: 'Active',
      notes: 'Vegetable peeling, washing, chopping, and general kitchen cleanup.',
      createdAt: '2024-02-01T08:00:00Z',
      photo: null,
    },
    {
      id: 'emp-9',
      employeeId: 'EMP-1009',
      name: 'Suresh Patil',
      phone: '9844667788',
      email: null,
      department: 'Kitchen',
      role: 'Helper',
      joiningDate: '2024-02-05',
      shift: 'Evening',
      employmentType: 'Part-time',
      salary: 15000,
      status: 'Active',
      notes: 'Dishwashing and kitchen utility helper.',
      createdAt: '2024-02-05T08:00:00Z',
      photo: null,
    },

    // 3. Service Staff (Waiters, Captains)
    {
      id: 'emp-10',
      employeeId: 'EMP-1010',
      name: 'Rahul Sharma',
      phone: '9876112233',
      email: 'rahul.s@diner.com',
      department: 'Service',
      role: 'Senior Waiter',
      joiningDate: '2023-03-20',
      shift: 'Evening',
      employmentType: 'Full-time',
      salary: 28000,
      status: 'Active',
      notes: 'High performer. Assigned to premium lounge tables. Great customer feedback.',
      createdAt: '2023-03-20T08:00:00Z',
      photo: AVATARS[7],
      waiterProfile: {
        id: 'w-1',
        ordersServed: 420,
        salesHandled: 185000,
        tableAssignments: [{ id: 't1', tableNumber: '1' }, { id: 't2', tableNumber: '2' }]
      }
    },
    {
      id: 'emp-11',
      employeeId: 'EMP-1011',
      name: 'Priya Patel',
      phone: '9876223344',
      email: 'priya.p@diner.com',
      department: 'Service',
      role: 'Waiter',
      joiningDate: '2023-05-15',
      shift: 'Morning',
      employmentType: 'Full-time',
      salary: 24000,
      status: 'Active',
      notes: 'Punctual and friendly. Manages family dining section.',
      createdAt: '2023-05-15T08:00:00Z',
      photo: AVATARS[8],
      waiterProfile: {
        id: 'w-2',
        ordersServed: 310,
        salesHandled: 124000,
        tableAssignments: [{ id: 't3', tableNumber: '3' }, { id: 't4', tableNumber: '4' }]
      }
    },
    {
      id: 'emp-12',
      employeeId: 'EMP-1012',
      name: 'Aditya Rao',
      phone: '9876334455',
      email: 'aditya.r@diner.com',
      department: 'Service',
      role: 'Waiter',
      joiningDate: '2023-08-10',
      shift: 'Evening',
      employmentType: 'Full-time',
      salary: 24000,
      status: 'Active',
      notes: 'Quick learner. Handles outdoor patio tables.',
      createdAt: '2023-08-10T08:00:00Z',
      photo: AVATARS[11],
      waiterProfile: {
        id: 'w-3',
        ordersServed: 285,
        salesHandled: 112000,
        tableAssignments: [{ id: 't5', tableNumber: '5' }]
      }
    },
    {
      id: 'emp-13',
      employeeId: 'EMP-1013',
      name: 'Sneha Nair',
      phone: '9876445566',
      email: 'sneha.n@diner.com',
      department: 'Service',
      role: 'Waiter',
      joiningDate: '2023-11-01',
      shift: 'Morning',
      employmentType: 'Part-time',
      salary: 16000,
      status: 'Active',
      notes: 'College student. Works morning rush hours.',
      createdAt: '2023-11-01T08:00:00Z',
      photo: AVATARS[12],
      waiterProfile: {
        id: 'w-4',
        ordersServed: 145,
        salesHandled: 58000,
        tableAssignments: [{ id: 't6', tableNumber: '6' }]
      }
    },
    {
      id: 'emp-14',
      employeeId: 'EMP-1014',
      name: 'Rohan Mehta',
      phone: '9876556677',
      email: 'rohan.m@diner.com',
      department: 'Service',
      role: 'Waiter',
      joiningDate: '2024-01-05',
      shift: 'Evening',
      employmentType: 'Full-time',
      salary: 24000,
      status: 'Active',
      notes: 'New recruit. Undergoing training on billing interface.',
      createdAt: '2024-01-05T08:00:00Z',
      photo: AVATARS[13],
      waiterProfile: {
        id: 'w-5',
        ordersServed: 98,
        salesHandled: 39000,
        tableAssignments: []
      }
    },
    {
      id: 'emp-15',
      employeeId: 'EMP-1015',
      name: 'Vikram Singh',
      phone: '9876667788',
      email: 'vikram.s@diner.com',
      department: 'Service',
      role: 'Captain',
      joiningDate: '2023-02-01',
      shift: 'Mid-Day Split',
      employmentType: 'Full-time',
      salary: 38000,
      status: 'Active',
      notes: 'Supervises waiters on the main floor. Coordinates VIP bookings.',
      createdAt: '2023-02-01T08:00:00Z',
      photo: AVATARS[15],
      waiterProfile: {
        id: 'w-6',
        ordersServed: 580,
        salesHandled: 310000,
        tableAssignments: [{ id: 't10', tableNumber: '10' }, { id: 't11', tableNumber: '11' }]
      }
    },
    {
      id: 'emp-16',
      employeeId: 'EMP-1016',
      name: 'Kriti Deshmukh',
      phone: '9876778899',
      email: 'kriti.d@diner.com',
      department: 'Service',
      role: 'Waiter',
      joiningDate: '2024-02-15',
      shift: 'Morning',
      employmentType: 'Full-time',
      salary: 24000,
      status: 'Active',
      notes: 'Experienced server. Transferred from Pune branch.',
      createdAt: '2024-02-15T08:00:00Z',
      photo: AVATARS[16],
      waiterProfile: {
        id: 'w-7',
        ordersServed: 45,
        salesHandled: 22000,
        tableAssignments: [{ id: 't7', tableNumber: '7' }]
      }
    },
    {
      id: 'emp-17',
      employeeId: 'EMP-1017',
      name: 'Arjun Kapoor',
      phone: '9876889900',
      email: 'arjun.k@diner.com',
      department: 'Service',
      role: 'Waiter',
      joiningDate: '2024-03-01',
      shift: 'Evening',
      employmentType: 'Part-time',
      salary: 16000,
      status: 'Active',
      notes: 'Works weekend night shifts.',
      createdAt: '2024-03-01T08:00:00Z',
      photo: AVATARS[19],
      waiterProfile: {
        id: 'w-8',
        ordersServed: 32,
        salesHandled: 15000,
        tableAssignments: []
      }
    },

    // 4. Billing (Cashiers, Billing Executives)
    {
      id: 'emp-18',
      employeeId: 'EMP-1018',
      name: 'Neha Gupta',
      phone: '9820556677',
      email: 'neha.g@diner.com',
      department: 'Billing',
      role: 'Cashier',
      joiningDate: '2023-04-10',
      shift: 'Morning',
      employmentType: 'Full-time',
      salary: 35000,
      status: 'Active',
      notes: 'Manages main cash drawer. Highly accurate billing audits.',
      createdAt: '2023-04-10T08:00:00Z',
      photo: AVATARS[17],
    },
    {
      id: 'emp-19',
      employeeId: 'EMP-1019',
      name: 'Amit Trivedi',
      phone: '9820667788',
      email: 'amit.t@diner.com',
      department: 'Billing',
      role: 'Billing Executive',
      joiningDate: '2023-07-20',
      shift: 'Evening',
      employmentType: 'Full-time',
      salary: 30000,
      status: 'Active',
      notes: 'Handles POS terminals, credit card slips, and online order reconciliation.',
      createdAt: '2023-07-20T08:00:00Z',
      photo: AVATARS[0],
    },
    {
      id: 'emp-20',
      employeeId: 'EMP-1020',
      name: 'Riddhi Shah',
      phone: '9820778899',
      email: 'riddhi.s@diner.com',
      department: 'Billing',
      role: 'Cashier',
      joiningDate: '2023-12-01',
      shift: 'Evening',
      employmentType: 'Part-time',
      salary: 20000,
      status: 'Active',
      notes: 'Part-time evening billing support.',
      createdAt: '2023-12-01T08:00:00Z',
      photo: AVATARS[10],
    },

    // 5. Inventory (Inventory Managers, Store Keepers)
    {
      id: 'emp-21',
      employeeId: 'EMP-1021',
      name: 'Siddharth Roy',
      phone: '9819112233',
      email: 'sid.roy@diner.com',
      department: 'Inventory',
      role: 'Inventory Manager',
      joiningDate: '2023-03-01',
      shift: 'General',
      employmentType: 'Full-time',
      salary: 55000,
      status: 'Active',
      notes: 'Supervises ingredient stocks, place purchase orders, and audits cold storage.',
      createdAt: '2023-03-01T08:00:00Z',
      photo: AVATARS[13],
    },
    {
      id: 'emp-22',
      employeeId: 'EMP-1022',
      name: 'Ganesh Shinde',
      phone: '9819223344',
      email: 'ganesh.s@diner.com',
      department: 'Inventory',
      role: 'Store Keeper',
      joiningDate: '2023-08-15',
      shift: 'Morning',
      employmentType: 'Full-time',
      salary: 28000,
      status: 'Active',
      notes: 'Handles goods receiving, verifies invoices against POs, and organizes shelves.',
      createdAt: '2023-08-15T08:00:00Z',
      photo: null,
    },

    // 6. Security (Security Guards, Supervisors)
    {
      id: 'emp-23',
      employeeId: 'EMP-1023',
      name: 'Baldev Singh',
      phone: '9899112233',
      email: null,
      department: 'Security',
      role: 'Security Guard',
      joiningDate: '2023-02-15',
      shift: 'Evening',
      employmentType: 'Full-time',
      salary: 20000,
      status: 'Active',
      notes: 'Secures entrance gate and manages customer valet parking queue.',
      createdAt: '2023-02-15T08:00:00Z',
      photo: null,
    },
    {
      id: 'emp-24',
      employeeId: 'EMP-1024',
      name: 'Jagdish Yadav',
      phone: '9899223344',
      email: null,
      department: 'Security',
      role: 'Security Guard',
      joiningDate: '2023-05-20',
      shift: 'Night',
      employmentType: 'Full-time',
      salary: 20000,
      status: 'Active',
      notes: 'Night surveillance and gate security.',
      createdAt: '2023-05-20T08:00:00Z',
      photo: null,
    },
    {
      id: 'emp-25',
      employeeId: 'EMP-1025',
      name: 'Dharma Gowda',
      phone: '9899334455',
      email: 'dharma.g@diner.com',
      department: 'Security',
      role: 'Supervisor',
      joiningDate: '2023-01-10',
      shift: 'General',
      employmentType: 'Full-time',
      salary: 30000,
      status: 'Active',
      notes: 'Security supervisor. Audits CCTV logs and handles emergency drills.',
      createdAt: '2023-01-10T08:00:00Z',
      photo: null,
    },

    // 7. Cleaning (Housekeeping, Cleaners)
    {
      id: 'emp-26',
      employeeId: 'EMP-1026',
      name: 'Sunita Bai',
      phone: '9833112233',
      email: null,
      department: 'Cleaning',
      role: 'Housekeeping',
      joiningDate: '2023-03-01',
      shift: 'Morning',
      employmentType: 'Full-time',
      salary: 18000,
      status: 'Active',
      notes: 'Cleans dining area floors, washrooms, and dusting.',
      createdAt: '2023-03-01T08:00:00Z',
      photo: null,
    },
    {
      id: 'emp-27',
      employeeId: 'EMP-1027',
      name: 'Lata Jadhav',
      phone: '9833223344',
      email: null,
      department: 'Cleaning',
      role: 'Housekeeping',
      joiningDate: '2023-06-01',
      shift: 'Evening',
      employmentType: 'Full-time',
      salary: 18000,
      status: 'Active',
      notes: 'Maintains dining area sanitation during evening operational rush.',
      createdAt: '2023-06-01T08:00:00Z',
      photo: null,
    },
    {
      id: 'emp-28',
      employeeId: 'EMP-1028',
      name: 'Vijay Kadam',
      phone: '9833334455',
      email: null,
      department: 'Cleaning',
      role: 'Cleaner',
      joiningDate: '2023-10-15',
      shift: 'Night',
      employmentType: 'Full-time',
      salary: 17000,
      status: 'Active',
      notes: 'Deep kitchen cleaning, chimney wash, and waste disposal.',
      createdAt: '2023-10-15T08:00:00Z',
      photo: null,
    },

    // Additional Staff to reach 40+ Roster
    {
      id: 'emp-29',
      employeeId: 'EMP-1029',
      name: 'Devendra Jha',
      phone: '9811445566',
      email: 'devendra.jha@diner.com',
      department: 'Kitchen',
      role: 'Chef',
      joiningDate: '2023-05-18',
      shift: 'Morning',
      employmentType: 'Full-time',
      salary: 58000,
      status: 'Active',
      notes: 'Continental hot station chef. Expert in grills and steaks.',
      createdAt: '2023-05-18T08:00:00Z',
      photo: AVATARS[9],
    },
    {
      id: 'emp-30',
      employeeId: 'EMP-1030',
      name: 'Rohan Deshpande',
      phone: '9811556677',
      email: 'rohan.d@diner.com',
      department: 'Service',
      role: 'Waiter',
      joiningDate: '2024-03-10',
      shift: 'Morning',
      employmentType: 'Full-time',
      salary: 24000,
      status: 'Active',
      notes: 'Assigned to table reservation desk.',
      createdAt: '2024-03-10T08:00:00Z',
      photo: AVATARS[11],
      waiterProfile: {
        id: 'w-9',
        ordersServed: 12,
        salesHandled: 6500,
        tableAssignments: []
      }
    },
    {
      id: 'emp-31',
      employeeId: 'EMP-1031',
      name: 'Simran Gill',
      phone: '9811667788',
      email: 'simran.g@diner.com',
      department: 'Service',
      role: 'Waiter',
      joiningDate: '2024-03-12',
      shift: 'Evening',
      employmentType: 'Part-time',
      salary: 16000,
      status: 'Active',
      notes: 'Weekend evening server.',
      createdAt: '2024-03-12T08:00:00Z',
      photo: AVATARS[12],
      waiterProfile: {
        id: 'w-10',
        ordersServed: 8,
        salesHandled: 4200,
        tableAssignments: []
      }
    },
    {
      id: 'emp-32',
      employeeId: 'EMP-1032',
      name: 'Abhishek Patil',
      phone: '9811778899',
      email: 'abhishek.p@diner.com',
      department: 'Kitchen',
      role: 'Kitchen Staff',
      joiningDate: '2024-02-20',
      shift: 'Evening',
      employmentType: 'Full-time',
      salary: 30000,
      status: 'Active',
      notes: 'Tandoor assistant.',
      createdAt: '2024-02-20T08:00:00Z',
      photo: null,
    },
    {
      id: 'emp-33',
      employeeId: 'EMP-1033',
      name: 'Nisha Pillai',
      phone: '9811889900',
      email: 'nisha.p@diner.com',
      department: 'Service',
      role: 'Waiter',
      joiningDate: '2024-03-15',
      shift: 'Morning',
      employmentType: 'Full-time',
      salary: 24000,
      status: 'Active',
      notes: 'Trainee waiter.',
      createdAt: '2024-03-15T08:00:00Z',
      photo: AVATARS[16],
      waiterProfile: {
        id: 'w-11',
        ordersServed: 5,
        salesHandled: 2100,
        tableAssignments: []
      }
    },
    {
      id: 'emp-34',
      employeeId: 'EMP-1034',
      name: 'Manish Pandey',
      phone: '9822112233',
      email: 'manish.p@diner.com',
      department: 'Billing',
      role: 'Billing Executive',
      joiningDate: '2024-01-20',
      shift: 'Morning',
      employmentType: 'Full-time',
      salary: 29000,
      status: 'Active',
      notes: 'Handles POS, invoice print, and online orders.',
      createdAt: '2024-01-20T08:00:00Z',
      photo: null,
    },
    {
      id: 'emp-35',
      employeeId: 'EMP-1035',
      name: 'Rajesh Solanki',
      phone: '9822223344',
      email: null,
      department: 'Security',
      role: 'Security Guard',
      joiningDate: '2023-11-15',
      shift: 'Night',
      employmentType: 'Full-time',
      salary: 20000,
      status: 'Active',
      notes: 'Night security patrolling.',
      createdAt: '2023-11-15T08:00:00Z',
      photo: null,
    },
    {
      id: 'emp-36',
      employeeId: 'EMP-1036',
      name: 'Savita Thorat',
      phone: '9833445577',
      email: null,
      department: 'Cleaning',
      role: 'Housekeeping',
      joiningDate: '2024-01-05',
      shift: 'Morning',
      employmentType: 'Part-time',
      salary: 12000,
      status: 'Active',
      notes: 'Morning tables setup and polishing.',
      createdAt: '2024-01-05T08:00:00Z',
      photo: null,
    },
    {
      id: 'emp-37',
      employeeId: 'EMP-1037',
      name: 'Gita Mali',
      phone: '9833556688',
      email: null,
      department: 'Cleaning',
      role: 'Housekeeping',
      joiningDate: '2024-02-10',
      shift: 'Evening',
      employmentType: 'Full-time',
      salary: 18000,
      status: 'Active',
      notes: 'Cleans tables and keeps serving stations clean.',
      createdAt: '2024-02-10T08:00:00Z',
      photo: null,
    },
    {
      id: 'emp-38',
      employeeId: 'EMP-1038',
      name: 'Yuvraj Patil',
      phone: '9833667799',
      email: null,
      department: 'Cleaning',
      role: 'Cleaner',
      joiningDate: '2024-03-01',
      shift: 'Night',
      employmentType: 'Full-time',
      salary: 17000,
      status: 'Active',
      notes: 'Kitchen helper and scrubber.',
      createdAt: '2024-03-01T08:00:00Z',
      photo: null,
    },
    {
      id: 'emp-39',
      employeeId: 'EMP-1039',
      name: 'Vikas Sable',
      phone: '9844112233',
      email: 'vikas.sable@diner.com',
      department: 'Inventory',
      role: 'Store Keeper',
      joiningDate: '2024-02-15',
      shift: 'Evening',
      employmentType: 'Full-time',
      salary: 28000,
      status: 'Active',
      notes: 'Receives evening vegetable and milk supplies.',
      createdAt: '2024-02-15T08:00:00Z',
      photo: null,
    },
    {
      id: 'emp-40',
      employeeId: 'EMP-1040',
      name: 'Anjali Deshpande',
      phone: '9844223344',
      email: 'anjali.d@diner.com',
      department: 'Management',
      role: 'Admin',
      joiningDate: '2022-12-01',
      shift: 'General',
      employmentType: 'Full-time',
      salary: 98000,
      status: 'Active',
      notes: 'Main system administrator. Sets permissions and manages system integration.',
      createdAt: '2022-12-01T08:00:00Z',
      photo: AVATARS[10],
    },
    {
      id: 'emp-41',
      employeeId: 'EMP-1041',
      name: 'Zainab Khan',
      phone: '9844334455',
      email: 'zainab.k@diner.com',
      department: 'Kitchen',
      role: 'Helper',
      joiningDate: '2024-03-10',
      shift: 'Morning',
      employmentType: 'Part-time',
      salary: 14000,
      status: 'Active',
      notes: 'Kitchen helper for morning prepping.',
      createdAt: '2024-03-10T08:00:00Z',
      photo: null,
    },
    {
      id: 'emp-42',
      employeeId: 'EMP-1042',
      name: 'Harish Goud',
      phone: '9844556677',
      email: 'harish.g@diner.com',
      department: 'Service',
      role: 'Waiter',
      joiningDate: '2023-07-15',
      shift: 'Mid-Day Split',
      employmentType: 'Full-time',
      salary: 24000,
      status: 'On Leave',
      notes: 'On medical leave for knee surgery. Expected back next week.',
      createdAt: '2023-07-15T08:00:00Z',
      photo: AVATARS[13],
      waiterProfile: {
        id: 'w-12',
        ordersServed: 190,
        salesHandled: 82000,
        tableAssignments: []
      }
    }
  ];

  // Set up attendance history for the past 7 days for all active employees
  const today = new Date();
  list.forEach(emp => {
    const history: any[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Sunday is weekly off
      if (date.getDay() === 0) continue;

      if (emp.status === 'On Leave' && i === 0) {
        history.push({
          id: `att-${emp.id}-${i}`,
          date: `${dateStr}T09:00:00Z`,
          status: 'Leave',
          checkIn: null,
          checkOut: null,
          workHours: 0,
          overtime: 0,
          notes: 'Approved medical leave'
        });
        continue;
      }

      const randomVal = Math.random();
      let status = 'Present';
      let checkIn = '09:00 AM';
      let checkOut = '05:30 PM';
      let workHours = 8.0;
      let overtime = 0.5;

      if (emp.shift === 'Morning') {
        checkIn = '07:02 AM';
        checkOut = '03:15 PM';
        workHours = 8.0;
      } else if (emp.shift === 'Evening') {
        checkIn = '03:05 PM';
        checkOut = '11:10 PM';
        workHours = 8.0;
      } else if (emp.shift === 'Night') {
        checkIn = '11:00 PM';
        checkOut = '07:00 AM';
        workHours = 8.0;
      }

      if (randomVal > 0.95) {
        status = 'Absent';
        checkIn = '';
        checkOut = '';
        workHours = 0;
        overtime = 0;
      } else if (randomVal > 0.85) {
        status = 'Late';
        if (emp.shift === 'Morning') checkIn = '07:35 AM';
        else if (emp.shift === 'General') checkIn = '09:40 AM';
        else checkIn = '03:45 PM';
        workHours = 7.2;
        overtime = 0;
      }

      history.push({
        id: `att-${emp.id}-${i}`,
        date: `${dateStr}T09:00:00Z`,
        status,
        checkIn: status !== 'Absent' ? checkIn : null,
        checkOut: status !== 'Absent' ? checkOut : null,
        workHours,
        overtime,
        notes: status === 'Late' ? 'Traffic delay' : 'Routine shift'
      });
    }
    emp.attendance = history;
  });

  return list;
};

export const generateMockLeaves = (_employees: Employee[]): Leave[] => {
  const leavesList: Leave[] = [
    {
      id: 'l-1',
      employeeId: 'emp-42',
      leaveType: 'Sick Leave',
      reason: 'Knee surgery recovery and post-op checkup',
      startDate: '2026-06-25T00:00:00Z',
      endDate: '2026-07-05T00:00:00Z',
      status: 'Approved',
      createdAt: '2026-06-20T10:30:00Z',
      employee: {
        name: 'Harish Goud',
        role: 'Waiter',
        employeeId: 'EMP-1042'
      }
    },
    {
      id: 'l-2',
      employeeId: 'emp-10',
      leaveType: 'Casual Leave',
      reason: 'Attending cousin sister wedding in hometown',
      startDate: '2026-07-02T00:00:00Z',
      endDate: '2026-07-05T00:00:00Z',
      status: 'Pending',
      createdAt: '2026-06-29T14:12:00Z',
      employee: {
        name: 'Rahul Sharma',
        role: 'Senior Waiter',
        employeeId: 'EMP-1010'
      }
    },
    {
      id: 'l-3',
      employeeId: 'emp-6',
      leaveType: 'Casual Leave',
      reason: 'Family shifting to new apartment',
      startDate: '2026-07-08T00:00:00Z',
      endDate: '2026-07-09T00:00:00Z',
      status: 'Pending',
      createdAt: '2026-06-30T09:45:00Z',
      employee: {
        name: 'Karan Veer',
        role: 'Kitchen Staff',
        employeeId: 'EMP-1006'
      }
    },
    {
      id: 'l-4',
      employeeId: 'emp-11',
      leaveType: 'Earned Leave',
      reason: 'Annual vacation with parents',
      startDate: '2026-05-10T00:00:00Z',
      endDate: '2026-05-18T00:00:00Z',
      status: 'Approved',
      createdAt: '2026-05-01T11:00:00Z',
      employee: {
        name: 'Priya Patel',
        role: 'Waiter',
        employeeId: 'EMP-1011'
      }
    },
    {
      id: 'l-5',
      employeeId: 'emp-21',
      leaveType: 'Sick Leave',
      reason: 'Fever and cold. Advised rest.',
      startDate: '2026-06-12T00:00:00Z',
      endDate: '2026-06-14T00:00:00Z',
      status: 'Approved',
      createdAt: '2026-06-11T18:30:00Z',
      employee: {
        name: 'Siddharth Roy',
        role: 'Inventory Manager',
        employeeId: 'EMP-1021'
      }
    }
  ];
  return leavesList;
};

export const generateMockSalaries = (employees: Employee[]): Salary[] => {
  const salariesList: Salary[] = [];
  
  // Generate payroll for past month for top 15 employees
  employees.slice(0, 15).forEach((emp, index) => {
    const basic = emp.salary || 25000;
    const allowances = Math.round(basic * 0.1);
    const deductions = Math.round(basic * 0.05);
    const overtime = index % 3 === 0 ? 3500 : 0;
    const bonus = index % 5 === 0 ? 5000 : 0;
    const net = basic + allowances + overtime + bonus - deductions;

    salariesList.push({
      id: `sal-${emp.id}`,
      employeeId: emp.id,
      basicSalary: basic,
      allowances,
      deductions,
      overtime,
      bonus,
      netSalary: net,
      paymentStatus: index === 1 ? 'Unpaid' : 'Paid',
      paymentDate: index === 1 ? null : '2026-06-05',
      createdAt: '2026-06-01T10:00:00Z',
      employee: {
        name: emp.name,
        role: emp.role,
        employeeId: emp.employeeId,
        department: emp.department
      }
    });
  });

  return salariesList;
};

export const generateMockStats = (employees: Employee[], leaves: Leave[]): Stats => {
  const todayStr = new Date().toISOString().split('T')[0];
  const total = employees.length;
  const present = employees.filter(e => {
    const todayRec = e.attendance?.find(a => a.date.startsWith(todayStr));
    return todayRec && (todayRec.status === 'Present' || todayRec.status === 'Late');
  }).length || 38; // Default fallback

  const onLeave = leaves.filter(l => l.status === 'Approved' && todayStr >= l.startDate.split('T')[0] && todayStr <= l.endDate.split('T')[0]).length;

  return {
    totalEmployees: total,
    activeEmployees: present,
    presentToday: present,
    onLeaveToday: onLeave,
    salaryProcessing: 1, // Pending payout count
    recentActivities: [
      {
        id: 'act-1',
        action: 'Attendance Check-In',
        details: 'Checked in at 07:02 AM (Punctual)',
        timestamp: new Date().toISOString(),
        employee: { name: 'Priya Patel', role: 'Waiter' }
      },
      {
        id: 'act-2',
        action: 'Table Assignment',
        details: 'Assigned Table 14 and Table 15',
        timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
        employee: { name: 'Vikram Singh', role: 'Captain' }
      },
      {
        id: 'act-3',
        action: 'Shift Swap Request',
        details: 'Filed request for Morning -> Evening shift swap',
        timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
        employee: { name: 'Rahul Sharma', role: 'Senior Waiter' }
      },
      {
        id: 'act-4',
        action: 'Leave Approved',
        details: 'Medical leave approved by Vikram Malhotra',
        timestamp: new Date(Date.now() - 240 * 60000).toISOString(),
        employee: { name: 'Harish Goud', role: 'Waiter' }
      },
      {
        id: 'act-5',
        action: 'Payroll Slip Generated',
        details: 'May 2026 Salary slip generated & processed',
        timestamp: new Date(Date.now() - 360 * 60000).toISOString(),
        employee: { name: 'Neha Gupta', role: 'Cashier' }
      }
    ]
  };
};
