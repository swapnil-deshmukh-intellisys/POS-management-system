import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Plus,
  Layers,
  QrCode,
  Download,
  Printer,
  Smartphone,
  Paintbrush
} from 'lucide-react';

export const DigitalMenuBuilder: React.FC = () => {
  const { user, apiRequest } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'menu' | 'qr' | 'customizer'>('menu');
  const [selectedTableForPreview, setSelectedTableForPreview] = useState<any>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Modal forms states
  const [showCatModal, setShowCatModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // New Category Fields
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // New MenuItem Fields
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');
  const [newItemImage, setNewItemImage] = useState('');
  const [newItemImageName, setNewItemImageName] = useState('');
  const [newItemIsChefSpecial, setNewItemIsChefSpecial] = useState(false);
  const [newItemIsRecommended, setNewItemIsRecommended] = useState(false);
  const [newItemIsOnOffer, setNewItemIsOnOffer] = useState(false);
  const [newItemOfferPrice, setNewItemOfferPrice] = useState('');
  const [foodType, setFoodType] = useState('Veg');
  const [addons, setAddons] = useState<any[]>([]);

  const handleAddAddonRow = () => {
    setAddons(prev => [
      ...prev,
      { name: '', price: 0, category: 'Extra', maxQty: 1, isOptional: true }
    ]);
  };

  const handleUpdateAddon = (index: number, field: string, value: any) => {
    setAddons(prev => prev.map((ad, i) => i === index ? { ...ad, [field]: value } : ad));
  };

  const handleRemoveAddon = (index: number) => {
    setAddons(prev => prev.filter((_, i) => i !== index));
  };

  // Customizer States
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=120&h=120&q=80');
  const [coverUrl, setCoverUrl] = useState('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&h=400&q=80');
  const [themeColor, setThemeColor] = useState('emerald'); // emerald, amber, rose, indigo, violet
  const [welcomeMsg, setWelcomeMsg] = useState('Welcome to our restaurant! Scan the QR to browse our gourmet dishes.');
  const [enableSpiceLevels, setEnableSpiceLevels] = useState(false);

  const fetchMenuData = async () => {
    try {
      const cats = await apiRequest(`/restaurant/menu/categories?restaurantId=${user?.restaurantId || 'mock-id'}`);
      const items = await apiRequest(`/restaurant/menu/items?restaurantId=${user?.restaurantId || 'mock-id'}`);

      const defaultCats = [
        { id: 'c-1', name: 'Starters', description: 'Crispy finger foods & appetizers' },
        { id: 'c-2', name: 'Soups', description: 'Freshly prepared hot soups' },
        { id: 'c-3', name: 'Main Course', description: 'Gourmet main course entrees' },
        { id: 'c-5', name: 'Sea Food', description: 'Fresh catch seafood items' },
        { id: 'c-6', name: 'Rice', description: 'Premium long grain rice & biryanis' },
        { id: 'c-7', name: 'Breads', description: 'Freshly baked tandoori rotis & naans' },
        { id: 'c-9', name: 'Pizza', description: 'Handmade cheese pizzas' },
        { id: 'c-10', name: 'Burgers', description: 'Juicy customized burgers' },
        { id: 'c-13', name: 'Desserts', description: 'Delicious sweet endings' },
        { id: 'c-15', name: 'Beverages', description: 'Cold drinks, soda & juices' }
      ];

      const defaultItems = [
        // ================= STARTERS (c-1 - 20 Items) =================
        { id: 'st-1', categoryId: 'c-1', name: 'Paneer Tikka', description: '[Type: Veg] Grilled cottage cheese cubes marinated in tandoori spices', price: 180, isVeg: true, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'st-2', categoryId: 'c-1', name: 'Veg Crispy', description: '[Type: Veg] Batter fried crispy mixed vegetables tossed in tangy sauce', price: 160, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'st-3', categoryId: 'c-1', name: 'Hara Bhara Kabab', description: '[Type: Veg] Delicate patties of spinach, green peas, and potatoes', price: 150, isVeg: true, isChefSpecial: false, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'st-4', categoryId: 'c-1', name: 'Chicken Tikka', description: '[Type: Non-Veg] Clay oven roasted tender chicken chunks in spiced red marinade', price: 240, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'st-5', categoryId: 'c-1', name: 'Crispy Corn', description: '[Type: Veg] Deep fried sweet corn kernels tossed with spices and onions', price: 140, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'st-6', categoryId: 'c-1', name: 'Gobi Manchurian Dry', description: '[Type: Veg] Cauliflower florets tossed in hot schezwan sauce', price: 150, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'st-7', categoryId: 'c-1', name: 'Mushroom Duplex', description: '[Type: Veg] Stuffed mushroom caps crumb fried and served with dip', price: 190, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1517244681291-7d930cc7ab3b?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'st-8', categoryId: 'c-1', name: 'Veg Spring Rolls', description: '[Type: Veg] Crispy pastry sheets filled with seasoned julienne vegetables', price: 160, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'st-9', categoryId: 'c-1', name: 'Cheese Cherry Pineapple', description: '[Type: Veg] Classic cocktail starter with cheese cubes, cherries and pineapple', price: 170, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'st-10', categoryId: 'c-1', name: 'Soya Chaap Tikka', description: '[Type: Veg] Soya chunks marinated in spiced yogurt and grilled in tandoor', price: 180, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'st-11', categoryId: 'c-1', name: 'Chicken Lollipop', description: '[Type: Non-Veg] Deep-fried seasoned chicken wings served with schezwan sauce', price: 220, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'st-12', categoryId: 'c-1', name: 'Chicken Seekh Kebab', description: '[Type: Non-Veg] Spiced skewered minced chicken rolls baked in tandoor', price: 260, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'st-13', categoryId: 'c-1', name: 'Mutton Seekh Kebab', description: '[Type: Non-Veg] Traditional spiced minced mutton skewers grilled to perfection', price: 320, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'st-14', categoryId: 'c-1', name: 'Fish Amritsari', description: '[Type: Sea Food] Batter-fried fish fingers coated with carom-flavored gram flour', price: 280, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'st-15', categoryId: 'c-1', name: 'Golden Fried Prawns', description: '[Type: Sea Food] Crispy golden fried prawns served with hot garlic dip', price: 340, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'st-16', categoryId: 'c-1', name: 'Chicken Spring Rolls', description: '[Type: Non-Veg] Crispy wraps stuffed with minced chicken and vegetables', price: 190, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'st-17', categoryId: 'c-1', name: 'Tandoori Chicken Wings', description: '[Type: Non-Veg] Juicy chicken wings marinated in tandoori spices and charred', price: 210, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'st-18', categoryId: 'c-1', name: 'Veg Seekh Kebab', description: '[Type: Veg] Minced vegetable skewers seasoned with herbs and grilled', price: 160, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'st-19', categoryId: 'c-1', name: 'Paneer Hariyali Tikka', description: '[Type: Veg] Cottage cheese cubes marinated in mint and coriander paste', price: 190, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'st-20', categoryId: 'c-1', name: 'Chicken Garlic Kebab', description: '[Type: Non-Veg] Chicken chunks marinated in garlic and yogurt paste and grilled', price: 250, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },

        // ================= SOUPS (c-2 - 20 Items) =================
        { id: 'sp-1', categoryId: 'c-2', name: 'Veg Tomato Soup', description: '[Type: Veg] Rich creamy soup made with fresh red tomatoes and croutons', price: 110, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sp-2', categoryId: 'c-2', name: 'Veg Manchow Soup', description: '[Type: Veg] Spicy Indo-Chinese soup served with crispy fried noodles', price: 120, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sp-3', categoryId: 'c-2', name: 'Veg Hot & Sour Soup', description: '[Type: Veg] Spicy and sour broth loaded with finely chopped vegetables', price: 120, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sp-4', categoryId: 'c-2', name: 'Sweet Corn Veg Soup', description: '[Type: Veg] Mild comforting soup with sweet corn kernels and vegetables', price: 110, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sp-5', categoryId: 'c-2', name: 'Lemon Coriander Soup Veg', description: '[Type: Veg] Refreshing clear soup with fresh coriander and lemon squeeze', price: 120, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sp-6', categoryId: 'c-2', name: 'Mushroom Cream Soup', description: '[Type: Veg] Thick creamy soup made with fresh button mushrooms', price: 130, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sp-7', categoryId: 'c-2', name: 'Spinach Clear Soup', description: '[Type: Veg] Light clear broth containing fresh spinach leaves and garlic', price: 110, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sp-8', categoryId: 'c-2', name: 'Veg Clear Soup', description: '[Type: Veg] Light healthy broth with seasonal chopped vegetables', price: 100, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sp-9', categoryId: 'c-2', name: 'Noodle Soup Veg', description: '[Type: Veg] Clear soup containing soft noodles and green vegetables', price: 120, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sp-10', categoryId: 'c-2', name: 'Lentil & Veg Soup', description: '[Type: Veg] Nutritious thick soup made of yellow lentils and spices', price: 110, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sp-11', categoryId: 'c-2', name: 'Chicken Manchow Soup', description: '[Type: Non-Veg] Spicy Chinese soup with chicken bits and crispy noodles', price: 140, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sp-12', categoryId: 'c-2', name: 'Chicken Hot & Sour Soup', description: '[Type: Non-Veg] Tangy chicken broth loaded with chicken and egg drops', price: 140, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sp-13', categoryId: 'c-2', name: 'Sweet Corn Chicken Soup', description: '[Type: Non-Veg] Mild soup with cream corn and shredded chicken pieces', price: 130, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sp-14', categoryId: 'c-2', name: 'Clear Chicken Soup', description: '[Type: Non-Veg] Light clear soup with chicken strips and mild spices', price: 120, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sp-15', categoryId: 'c-2', name: 'Cream of Chicken Soup', description: '[Type: Non-Veg] Rich thick creamy chicken soup cooked with fresh cream', price: 150, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sp-16', categoryId: 'c-2', name: 'Chicken Lemon Coriander Soup', description: '[Type: Non-Veg] Healthy clear chicken broth seasoned with lemon and fresh coriander', price: 140, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sp-17', categoryId: 'c-2', name: 'Seafood Hot Soup', description: '[Type: Sea Food] Hot and sour broth with mixed prawns, crab meat, and squid', price: 160, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sp-18', categoryId: 'c-2', name: 'Fish Clear Soup', description: '[Type: Sea Food] Light clear broth featuring fresh fish cubes and dill', price: 150, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sp-19', categoryId: 'c-2', name: 'Prawns Cream Soup', description: '[Type: Sea Food] Smooth rich creamy soup with baby prawns and butter', price: 170, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sp-20', categoryId: 'c-2', name: 'Chicken Noodle Soup', description: '[Type: Non-Veg] Comforting hot chicken broth with soft egg noodles', price: 140, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80' },

        // ================= MAIN COURSE (c-3 - 20 Items) =================
        { id: 'v-1', categoryId: 'c-3', name: 'Dal Tadka', description: '[Type: Veg] Traditional yellow lentils tempered with ghee, garlic, and cumin', price: 180, isVeg: true, isChefSpecial: false, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-2', categoryId: 'c-3', name: 'Dal Khichadi', description: '[Type: Veg] Comforting rice and lentil porridge tempered with spices', price: 199, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-5', categoryId: 'c-3', name: 'Paneer Butter Masala', description: '[Type: Veg] Soft paneer cubes in creamy, mildly sweet tomato gravy', price: 260, isVeg: true, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-6', categoryId: 'c-3', name: 'Kadai Paneer', description: '[Type: Veg] Paneer cooked with bell peppers and freshly ground kadai spices', price: 250, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-7', categoryId: 'c-3', name: 'Veg Thali', description: '[Type: Veg] Complete meal with dal, two veg curries, rice, chapati, and sweet', price: 220, isVeg: true, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-8', categoryId: 'c-3', name: 'Paneer Tikka Masala', description: '[Type: Veg] Grilled paneer chunks in spicy spiced onion tomato gravy', price: 270, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-9', categoryId: 'c-3', name: 'Mix Vegetable Curry', description: '[Type: Veg] Seasonal mixed vegetables cooked in North Indian style gravy', price: 185, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-10', categoryId: 'c-3', name: 'Chole Bhature', description: '[Type: Veg] Spicy chickpea curry served with two puffed fried breads', price: 160, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1627662236973-4f8259fa2441?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-11', categoryId: 'c-3', name: 'Aloo Gobi Masala', description: '[Type: Veg] Classic dry dish of potatoes and cauliflower with spices', price: 150, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-18', categoryId: 'c-3', name: 'Palak Paneer', description: '[Type: Veg] Creamy cottage cheese cubes in rich spinach sauce', price: 240, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-1', categoryId: 'c-3', name: 'Chicken Thali', description: '[Type: Non-Veg] Special thali with Chicken Curry, Egg, Rice, Bhakri, and Solkadhi', price: 260, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-2', categoryId: 'c-3', name: 'Mutton Thali', description: '[Type: Non-Veg] Premium thali with Mutton Masala, Rassa, Rice, Bhakri, and Solkadhi', price: 340, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-3', categoryId: 'c-3', name: 'Chicken Handi', description: '[Type: Non-Veg] Tender chicken pieces cooked in aromatic spices in a handi', price: 360, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-5', categoryId: 'c-3', name: 'Butter Chicken', description: '[Type: Non-Veg] Tandoori chicken chunks cooked in rich buttery tomato sauce', price: 349, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-6', categoryId: 'c-3', name: 'Chicken Tikka Masala', description: '[Type: Non-Veg] Grilled chicken tikka in spiced curry gravy', price: 320, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-9', categoryId: 'c-3', name: 'Mutton Rogan Josh', description: '[Type: Non-Veg] Kashmiri style mutton cooked in yogurt and saffron gravy', price: 380, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-10', categoryId: 'c-3', name: 'Chicken Korma', description: '[Type: Non-Veg] Chicken braised with yogurt, cream, and nut paste', price: 310, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-14', categoryId: 'c-3', name: 'Chicken Masala', description: '[Type: Non-Veg] Homestyle thick chicken curry with fresh ground spices', price: 280, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-15', categoryId: 'c-3', name: 'Chicken Kadai', description: '[Type: Non-Veg] Chicken cooked with bell peppers in iron wok', price: 290, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-16', categoryId: 'c-3', name: 'Egg Masala Curry', description: '[Type: Non-Veg] Hard-boiled eggs in onion-tomato based gravy', price: 180, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },

        // ================= SEA FOOD (c-5 - 20 Items) =================
        { id: 'sf-1', categoryId: 'c-5', name: 'Fish Surmai Fry', description: '[Type: Sea Food] Tawa-fried Surmai steak coated in rava and spice blend', price: 299, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-2', categoryId: 'c-5', name: 'Prawns Masala', description: '[Type: Sea Food] Small prawns cooked in thick spiced coastal gravy', price: 360, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-3', categoryId: 'c-5', name: 'Fish Surmai Thali', description: '[Type: Sea Food] Surmai Fry, Fish Curry, Rice, Solkadhi, and Chapatis', price: 349, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-4', categoryId: 'c-5', name: 'Pomfret Fry', description: '[Type: Sea Food] Whole pomfret tawa fried with Konkani green masala', price: 399, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-5', categoryId: 'c-5', name: 'Prawns Koliwada', description: '[Type: Sea Food] Deep-fried crunchy prawns with local batter coating', price: 320, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-6', categoryId: 'c-5', name: 'Fish Curry Goan Style', description: '[Type: Sea Food] Coastal fish cooked in coconut-based tangy tamarind curry', price: 280, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-7', categoryId: 'c-5', name: 'Crab Masala Curry', description: '[Type: Sea Food] Whole mud crabs simmered in hot and spicy gravy', price: 450, isVeg: false, isChefSpecial: true, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-8', categoryId: 'c-5', name: 'Butter Garlic Prawns', description: '[Type: Sea Food] Juicy prawns tossed in garlic butter with black pepper', price: 380, isVeg: false, isChefSpecial: false, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-9', categoryId: 'c-5', name: 'Lobster Thermidor', description: '[Type: Sea Food] Gourmet lobster meat cooked in creamy wine sauce with cheese', price: 999, isVeg: false, isChefSpecial: true, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-10', categoryId: 'c-5', name: 'Fish Tikka', description: '[Type: Sea Food] Tandoor roasted boneless fish chunks with tikka marinade', price: 320, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-11', categoryId: 'c-5', name: 'Squid Chilli Dry', description: '[Type: Sea Food] Tossed squid rings with bell peppers, green chillies, and soy', price: 260, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-12', categoryId: 'c-5', name: 'Tandoori Pomfret', description: '[Type: Sea Food] Whole pomfret marinated in tandoori spice blend and charcoal-baked', price: 420, isVeg: false, isChefSpecial: true, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-13', categoryId: 'c-5', name: 'Prawns Dum Biryani', description: '[Type: Sea Food] Spiced prawns dum-cooked with long grain basmati rice', price: 340, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1563379971899-660589a01cc3?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-14', categoryId: 'c-5', name: 'Fish Chilli Gravy', description: '[Type: Sea Food] Boneless fish chunks tossed in thick spicy soy gravy', price: 280, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-15', categoryId: 'c-5', name: 'Oysters Rockefeller', description: '[Type: Sea Food] Baked oysters topped with butter, herbs, and breadcrumbs', price: 599, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-16', categoryId: 'c-5', name: 'Seafood Hot Soup', description: '[Type: Sea Food] Hot and sour broth with mixed prawns, crab meat, and squid', price: 149, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-17', categoryId: 'c-5', name: 'Bombil Rava Fry', description: '[Type: Sea Food] Crisp fried Bombay Duck coated with seasoned semolina', price: 199, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-18', categoryId: 'c-5', name: 'Seafood Fried Rice', description: '[Type: Sea Food] Long grain rice wok-tossed with fresh prawns and squid bits', price: 240, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-19', categoryId: 'c-5', name: 'Fish Fingers', description: '[Type: Sea Food] Crumbed and deep-fried fish strips served with tartar sauce', price: 220, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-20', categoryId: 'c-5', name: 'Prawns Fry Tawa', description: '[Type: Sea Food] Fresh prawns pan-fried in ginger-garlic and red chilli paste', price: 290, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },

        // ================= RICE (c-6 - 20 Items) =================
        { id: 'rc-1', categoryId: 'c-6', name: 'Jeera Rice', description: '[Type: Veg] Aromatic basmati rice tempered with cumin seeds and coriander', price: 120, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'rc-2', categoryId: 'c-6', name: 'Steam Basmati Rice', description: '[Type: Veg] Premium steamed long-grain basmati rice', price: 99, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'rc-3', categoryId: 'c-6', name: 'Veg Biryani', description: '[Type: Veg] Layers of basmati rice and mixed vegetables cooked on dum', price: 210, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1563379971899-660589a01cc3?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'rc-4', categoryId: 'c-6', name: 'Chicken Biryani', description: '[Type: Non-Veg] Long grain basmati rice and layered spiced chicken', price: 280, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1563379971899-660589a01cc3?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'rc-5', categoryId: 'c-6', name: 'Mutton Biryani', description: '[Type: Non-Veg] Premium basmati rice layered with juicy mutton chunks', price: 360, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1563379971899-660589a01cc3?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'rc-6', categoryId: 'c-6', name: 'Prawns Dum Biryani', description: '[Type: Sea Food] Spiced prawns dum-cooked with long grain basmati rice', price: 340, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1563379971899-660589a01cc3?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'rc-7', categoryId: 'c-6', name: 'Veg Fried Rice', description: '[Type: Veg] Wok-tossed rice with finely chopped garden vegetables', price: 160, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'rc-8', categoryId: 'c-6', name: 'Chicken Fried Rice', description: '[Type: Non-Veg] Fluffy wok rice tossed with egg, chicken, and green onions', price: 210, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'rc-9', categoryId: 'c-6', name: 'Egg Fried Rice', description: '[Type: Non-Veg] Fluffy wok rice tossed with scrambled eggs and spring onions', price: 180, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'rc-10', categoryId: 'c-6', name: 'Schezwan Veg Fried Rice', description: '[Type: Veg] Spicy rice tossed in house schezwan sauce with vegetables', price: 170, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'rc-11', categoryId: 'c-6', name: 'Schezwan Chicken Fried Rice', description: '[Type: Non-Veg] Wok fried rice with chicken, egg, and spicy schezwan paste', price: 220, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'rc-12', categoryId: 'c-6', name: 'Peas Pulao', description: '[Type: Veg] Mild basmati rice pilaf cooked with sweet green peas', price: 140, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'rc-13', categoryId: 'c-6', name: 'Kashmiri Pulao', description: '[Type: Veg] Sweetish basmati rice preparation cooked with dry fruits and apple slices', price: 190, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'rc-14', categoryId: 'c-6', name: 'Paneer Biryani', description: '[Type: Veg] Fragrant basmati rice layered with paneer tikka cubes', price: 240, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1563379971899-660589a01cc3?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'rc-15', categoryId: 'c-6', name: 'Egg Biryani', description: '[Type: Non-Veg] Premium basmati rice cooked with hard boiled spiced eggs', price: 220, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1563379971899-660589a01cc3?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'rc-16', categoryId: 'c-6', name: 'Mushroom Biryani', description: '[Type: Veg] Long grain rice cooked with button mushrooms and spices', price: 230, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1563379971899-660589a01cc3?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'rc-17', categoryId: 'c-6', name: 'Garlic Fried Rice Veg', description: '[Type: Veg] Fluffy basmati rice tossed with burnt garlic and green onions', price: 165, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'rc-18', categoryId: 'c-6', name: 'Singapore Veg Fried Rice', description: '[Type: Veg] Rice wok tossed with vegetables, curry powder and cashew nuts', price: 180, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'rc-19', categoryId: 'c-6', name: 'Mixed Seafood Rice', description: '[Type: Sea Food] Wok-tossed rice containing baby prawns, squid and fish flakes', price: 280, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'rc-20', categoryId: 'c-6', name: 'Lemon Rice', description: '[Type: Veg] South Indian rice dish tempered with mustard seeds, curry leaves, and lemon', price: 130, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&h=300&q=80' },

        // ================= BREADS (c-7 - 20 Items) =================
        { id: 'br-1', categoryId: 'c-7', name: 'Butter Tandoori Roti', description: '[Type: Veg] Whole wheat flatbread baked in tandoor with butter', price: 25, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'br-2', categoryId: 'c-7', name: 'Plain Tandoori Roti', description: '[Type: Veg] Whole wheat flatbread baked in tandoor without butter', price: 20, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'br-3', categoryId: 'c-7', name: 'Plain Naan', description: '[Type: Veg] Soft leavened white flour flatbread baked in clay oven', price: 40, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'br-4', categoryId: 'c-7', name: 'Butter Naan', description: '[Type: Veg] Soft white flour flatbread glazed with melted butter', price: 50, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'br-5', categoryId: 'c-7', name: 'Garlic Naan', description: '[Type: Veg] Clay oven flatbread topped with minced garlic and coriander', price: 60, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'br-6', categoryId: 'c-7', name: 'Cheese Naan', description: '[Type: Veg] Delicious flatbread stuffed with processed cheese and herbs', price: 80, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'br-7', categoryId: 'c-7', name: 'Laccha Paratha', description: '[Type: Veg] Multi-layered flaky whole wheat bread baked in tandoor', price: 45, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'br-8', categoryId: 'c-7', name: 'Pudina Paratha', description: '[Type: Veg] Flaky layered paratha flavored with dried mint powder', price: 50, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'br-9', categoryId: 'c-7', name: 'Plain Kulcha', description: '[Type: Veg] Leavened flatbread topped with sesame seeds and coriander', price: 40, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'br-10', categoryId: 'c-7', name: 'Butter Kulcha', description: '[Type: Veg] Soft kulcha glazed with butter', price: 45, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'br-11', categoryId: 'c-7', name: 'Masala Kulcha', description: '[Type: Veg] Kulcha stuffed with spicy potato and onion mixture', price: 70, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'br-12', categoryId: 'c-7', name: 'Paneer Kulcha', description: '[Type: Veg] Flatbread stuffed with seasoned grated cottage cheese', price: 85, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'br-13', categoryId: 'c-7', name: 'Roti Basket', description: '[Type: Veg] Assortment of Rotis, Naans, and Parathas (Serves 2-3)', price: 180, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'br-14', categoryId: 'c-7', name: 'Aloo Paratha', description: '[Type: Veg] Griddle-fried whole wheat flatbread stuffed with spiced potato masala', price: 70, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'br-15', categoryId: 'c-7', name: 'Paneer Paratha', description: '[Type: Veg] Griddle-fried flatbread filled with seasoned grated paneer', price: 90, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'br-16', categoryId: 'c-7', name: 'Missi Roti', description: '[Type: Veg] Nutritious flatbread made of gram flour, spices, and green chillies', price: 35, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'br-17', categoryId: 'c-7', name: 'Roomali Roti', description: '[Type: Veg] Extremely thin, soft flatbread folded like a handkerchief', price: 30, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'br-18', categoryId: 'c-7', name: 'Bhatura', description: '[Type: Veg] Large, deep-fried puffed leavened bread', price: 40, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'br-19', categoryId: 'c-7', name: 'Chapati', description: '[Type: Veg] Traditional Indian soft thin flatbread cooked on tawa', price: 15, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'br-20', categoryId: 'c-7', name: 'Keema Naan', description: '[Type: Non-Veg] Premium flatbread stuffed with spiced minced chicken', price: 120, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&h=300&q=80' },

        // ================= PIZZA (c-9 - 20 Items) =================
        { id: 'pz-1', categoryId: 'c-9', name: 'Margherita Pizza', description: '[Type: Veg] Classic hand-stretched crust topped with fresh mozzarella and basil oil', price: 299, isVeg: true, isChefSpecial: false, isRecommended: true, status: 'Active', isOnOffer: true, offerPrice: 249, image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'pz-2', categoryId: 'c-9', name: 'Farmhouse Pizza', description: '[Type: Veg] Fresh bell peppers, golden corn, fresh mushrooms, and onions', price: 349, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'pz-3', categoryId: 'c-9', name: 'Veg Supreme Pizza', description: '[Type: Veg] Overloaded paneer tikka, black olives, jalapenos, and baby corn', price: 389, isVeg: true, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'pz-4', categoryId: 'c-9', name: 'Cheese Burst Pizza', description: '[Type: Veg] Liquid cheese filled crust topped with double mozzarella and herbs', price: 429, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'pz-5', categoryId: 'c-9', name: 'Double Cheese Margherita', description: '[Type: Veg] Loaded with extra Mozzarella cheese on a classic tangy sauce base', price: 330, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'pz-6', categoryId: 'c-9', name: 'Spicy Paneer Pizza', description: '[Type: Veg] Spicy paneer chunks, red paprika, and capsicum', price: 360, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'pz-7', categoryId: 'c-9', name: 'Veggie Paradise', description: '[Type: Veg] Baby corn, black olives, red bell peppers, and capsicum', price: 350, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'pz-8', categoryId: 'c-9', name: 'Paneer Tikka Pizza', description: '[Type: Veg] Marinated cottage cheese chunks, onion, capsicum, and spicy masala drizzle', price: 370, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'pz-9', categoryId: 'c-9', name: 'Tandoori Paneer Pizza', description: '[Type: Veg] Tandoori paneer, green capsicum, onion, and red paprika with spicy sauce', price: 375, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'pz-10', categoryId: 'c-9', name: 'Five Cheese Pizza', description: '[Type: Veg] Mozzarella, Cheddar, Gouda, Feta, and Blue Cheese cream base', price: 440, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'pz-11', categoryId: 'c-9', name: 'Chicken Tikka Pizza', description: '[Type: Non-Veg] Tandoori chicken tikka pieces, green chillies, and red onion', price: 399, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'pz-12', categoryId: 'c-9', name: 'Pepperoni Pizza', description: '[Type: Non-Veg] Classic pork pepperoni slices and loaded mozzarella cheese', price: 420, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'pz-13', categoryId: 'c-9', name: 'Chicken BBQ Pizza', description: '[Type: Non-Veg] Grilled chicken chunks, BBQ sauce base, and sweet red onions', price: 410, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'pz-14', categoryId: 'c-9', name: 'Spicy Chicken Supreme', description: '[Type: Non-Veg] Spiced chicken chunks, chicken seekh, hot jalapenos, and red paprika', price: 430, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'pz-15', categoryId: 'c-9', name: 'Non-Veg Supreme', description: '[Type: Non-Veg] Chicken tikka, mutton keema, chicken seekh, onion, and olives', price: 450, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'pz-16', categoryId: 'c-9', name: 'Peri Peri Chicken Pizza', description: '[Type: Non-Veg] Chicken pieces in spicy peri-peri marinade, bell peppers, and onion', price: 410, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'pz-17', categoryId: 'c-9', name: 'Butter Chicken Pizza', description: '[Type: Non-Veg] Shredded chicken in rich butter chicken gravy, onion, and coriander', price: 420, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'pz-18', categoryId: 'c-9', name: 'Prawns & Garlic Pizza', description: '[Type: Sea Food] Fresh baby prawns, roasted garlic bits, and creamy white sauce', price: 460, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'pz-19', categoryId: 'c-9', name: 'Tuna & Onion Pizza', description: '[Type: Sea Food] Flaked tuna fish, red onion rings, green chillies, and olives', price: 430, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'pz-20', categoryId: 'c-9', name: 'Chicken Keema Pizza', description: '[Type: Non-Veg] Spiced minced chicken, green peas, onion, and green chillies', price: 390, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&h=300&q=80' },

        // ================= BURGERS (c-10 - 20 Items) =================
        { id: 'bg-1', categoryId: 'c-10', name: 'Veg Burger', description: '[Type: Veg] Crispy vegetable patty, sliced tomatoes, onions, lettuce, and mayo', price: 120, isVeg: true, isChefSpecial: false, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bg-2', categoryId: 'c-10', name: 'Cheese Burger', description: '[Type: Veg] Gourmet veg patty loaded with cheddar slice and house special sauce', price: 140, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', isOnOffer: true, offerPrice: 119, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bg-3', categoryId: 'c-10', name: 'Chicken Burger', description: '[Type: Non-Veg] Crispy fried chicken breast, pickled jalapenos, and spicy garlic aioli', price: 180, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bg-4', categoryId: 'c-10', name: 'Double Patty Burger', description: '[Type: Non-Veg] Grilled double chicken patties layered with caramelized onions and cheese', price: 240, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bg-5', categoryId: 'c-10', name: 'Spicy Paneer Burger', description: '[Type: Veg] Crispy paneer patty marinated in hot spices and loaded with sauce', price: 150, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bg-6', categoryId: 'c-10', name: 'Aloo Tikki Burger', description: '[Type: Veg] Golden fried potato patty with onion, tomato, and sweet-sour chutney', price: 90, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bg-7', categoryId: 'c-10', name: 'Mushroom Cheese Burger', description: '[Type: Veg] Veg patty topped with sautéed button mushrooms and melted Swiss cheese', price: 160, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bg-8', categoryId: 'c-10', name: 'Veg Chilli Lava Burger', description: '[Type: Veg] Veg patty with dynamic spicy chilli paste and liquid cheese slice', price: 150, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bg-9', categoryId: 'c-10', name: 'Paneer Tikka Burger', description: '[Type: Veg] Marinated paneer block roasted in tandoor and layered with mint mayo', price: 170, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bg-10', categoryId: 'c-10', name: 'Corn & Spinach Burger', description: '[Type: Veg] Creamy sweet corn and spinach patty with garlic sauce', price: 130, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bg-11', categoryId: 'c-10', name: 'Fried Fish Burger', description: '[Type: Sea Food] Crispy golden fried fish fillet served with tartar sauce and lettuce', price: 210, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bg-12', categoryId: 'c-10', name: 'Egg Burger', description: '[Type: Non-Veg] Two fried eggs cooked sunny-side up, onions, tomatoes, and mayo', price: 110, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bg-13', categoryId: 'c-10', name: 'BBQ Chicken Burger', description: '[Type: Non-Veg] Grilled chicken breast glazed with hickory BBQ sauce and cheese', price: 190, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bg-14', categoryId: 'c-10', name: 'Chicken Cheese Burst Burger', description: '[Type: Non-Veg] Chicken patty stuffed with melted liquid cheese inside', price: 210, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bg-15', categoryId: 'c-10', name: 'Tandoori Chicken Burger', description: '[Type: Non-Veg] Tandoori chicken tikka fillet layered with sliced onions and mint dressing', price: 190, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bg-16', categoryId: 'c-10', name: 'Crispy Prawn Burger', description: '[Type: Sea Food] Golden fried prawns patty served with spicy sriracha mayo', price: 230, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bg-17', categoryId: 'c-10', name: 'Mutton Keema Burger', description: '[Type: Non-Veg] Spiced minced mutton cooked in butter and served in warm burger buns', price: 250, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bg-18', categoryId: 'c-10', name: 'Double Mutton Burger', description: '[Type: Non-Veg] Two juicy grilled mutton patties, double cheese, and caramelized onion', price: 290, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bg-19', categoryId: 'c-10', name: 'Grilled Chicken Burger', description: '[Type: Non-Veg] Juicy herb-marinated grilled chicken breast fillet with fresh salad', price: 180, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bg-20', categoryId: 'c-10', name: 'Chicken Chilli Lava Burger', description: '[Type: Non-Veg] Crispy chicken patty, hot spicy red chilli sauce, and cheese slice', price: 200, isVeg: false, status: 'Active', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80' },

        // ================= DESSERTS (c-13 - 20 Items) =================
        { id: 'ds-1', categoryId: 'c-13', name: 'Sizzling Brownie', description: '[Type: Veg] Warm chocolate brownie on hot sizzler plate with vanilla scoop and fudge', price: 150, isVeg: true, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'ds-2', categoryId: 'c-13', name: 'Chocolate Lava Cake', description: '[Type: Veg] Freshly baked soft chocolate cake with molten chocolate core', price: 120, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'ds-3', categoryId: 'c-13', name: 'Vanilla Ice Cream', description: '[Type: Veg] Two scoops of classic creamy vanilla bean ice cream', price: 80, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'ds-4', categoryId: 'c-13', name: 'Chocolate Ice Cream', description: '[Type: Veg] Rich creamy double scoop chocolate ice cream with fudge sauce', price: 85, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'ds-5', categoryId: 'c-13', name: 'Strawberry Scoop', description: '[Type: Veg] Sweet creamy strawberry ice cream served with fruit syrup', price: 80, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'ds-6', categoryId: 'c-13', name: 'Gulab Jamun', description: '[Type: Veg] Two warm soft milk solids dumplings soaked in rose cardamom sugar syrup', price: 70, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'ds-7', categoryId: 'c-13', name: 'Kesar Rasmalai', description: '[Type: Veg] Two soft paneer discs soaked in sweet saffron reduced milk', price: 90, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'ds-8', categoryId: 'c-13', name: 'Chocolate Brownie', description: '[Type: Veg] Plain rich dense chocolate fudge brownie cake slice', price: 100, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'ds-9', categoryId: 'c-13', name: 'Blueberry Cheesecake', description: '[Type: Veg] Classic cold cheesecake slice topped with sweet blueberry compote', price: 160, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'ds-10', categoryId: 'c-13', name: 'Apple Pie with Ice Cream', description: '[Type: Veg] Warm spiced apple pie slice served with vanilla ice cream scoop', price: 140, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'ds-11', categoryId: 'c-13', name: 'Tiramisu Slice', description: '[Type: Veg] Elegant Italian dessert with coffee-soaked ladyfingers and mascarpone', price: 180, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'ds-12', categoryId: 'c-13', name: 'Fruit Custard', description: '[Type: Veg] Chilled sweet yellow vanilla custard mixed with fresh seasonal fruits', price: 95, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'ds-13', categoryId: 'c-13', name: 'Moong Dal Halwa', description: '[Type: Veg] Traditional rich warm dessert made of yellow lentils, ghee, and sugar', price: 100, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'ds-14', categoryId: 'c-13', name: 'Gajar Ka Halwa', description: '[Type: Veg] Warm sweet carrot pudding cooked with milk, ghee, and nuts', price: 110, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'ds-15', categoryId: 'c-13', name: 'Caramel Custard', description: '[Type: Veg] Classic sweet custard dessert baked with soft caramel syrup coating', price: 110, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'ds-16', categoryId: 'c-13', name: 'Chocolate Mousse', description: '[Type: Veg] Fluffy light airy chocolate cream whipped with dark cocoa', price: 120, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'ds-17', categoryId: 'c-13', name: 'Red Velvet Pastry', description: '[Type: Veg] Moist red velvet cake slice layered with rich cream cheese frosting', price: 130, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'ds-18', categoryId: 'c-13', name: 'Butterscotch Pastry', description: '[Type: Veg] Sweet vanilla sponge cake slice layered with butterscotch crunch and cream', price: 110, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'ds-19', categoryId: 'c-13', name: 'Mango Kulfi', description: '[Type: Veg] Traditional rich creamy frozen Indian mango dessert on stick', price: 90, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'ds-20', categoryId: 'c-13', name: 'Malai Kulfi', description: '[Type: Veg] Traditional cardamom infused condensed milk kulfi ice cream', price: 80, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&h=300&q=80' },

        // ================= BEVERAGES (c-15 - 20 Items) =================
        { id: 'bv-1', categoryId: 'c-15', name: 'Coffee', description: '[Type: Veg] Premium roasted arabica hot brewed coffee served with milk', price: 60, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bv-2', categoryId: 'c-15', name: 'Tea', description: '[Type: Veg] Traditional aromatic Indian masala chai brewed with fresh ginger', price: 40, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bv-3', categoryId: 'c-15', name: 'Cold Drink', description: '[Type: Veg] Chilled aerated carbonated cola drink can', price: 40, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bv-4', categoryId: 'c-15', name: 'Coke Zero', description: '[Type: Veg] Zero sugar chilled soft drink can', price: 45, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bv-5', categoryId: 'c-15', name: 'Fresh Lime Soda', description: '[Type: Veg] Chilled soda water with fresh lime juice, salt or sugar syrup', price: 60, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bv-6', categoryId: 'c-15', name: 'Mango Lassi', description: '[Type: Veg] Thick traditional sweet yogurt drink blended with mango pulp', price: 90, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bv-7', categoryId: 'c-15', name: 'Sweet Lassi', description: '[Type: Veg] Chilled whipped thick sweet yogurt drink flavored with rosewater', price: 75, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bv-8', categoryId: 'c-15', name: 'Salted Lassi', description: '[Type: Veg] Savory traditional yogurt drink flavored with cumin and salt', price: 75, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bv-9', categoryId: 'c-15', name: 'Masala Chaas', description: '[Type: Veg] Refreshing spiced buttermilk blended with coriander, mint and cumin', price: 50, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bv-10', categoryId: 'c-15', name: 'Iced Tea Peach', description: '[Type: Veg] Chilled brewed peach iced tea', price: 80, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bv-11', categoryId: 'c-15', name: 'Iced Tea Lemon', description: '[Type: Veg] Chilled brewed lemon iced tea', price: 80, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bv-12', categoryId: 'c-15', name: 'Virgin Mojito', description: '[Type: Veg] Refreshing classic virgin mojito drink', price: 110, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bv-13', categoryId: 'c-15', name: 'Cold Coffee', description: '[Type: Veg] Creamy rich cold coffee blend', price: 100, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bv-14', categoryId: 'c-15', name: 'Chocolate Milkshake', description: '[Type: Veg] Rich thick chocolate cream milkshake', price: 110, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bv-15', categoryId: 'c-15', name: 'Strawberry Milkshake', description: '[Type: Veg] Creamy milk drink blended with sweet strawberry sauce', price: 110, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bv-16', categoryId: 'c-15', name: 'Mineral Water', description: '[Type: Veg] Chilled packaged drinking mineral water bottle (1 Litre)', price: 30, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bv-17', categoryId: 'c-15', name: 'Orange Juice', description: '[Type: Veg] Freshly squeezed sweet orange juice served cold', price: 90, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bv-18', categoryId: 'c-15', name: 'Pineapple Juice', description: '[Type: Veg] Freshly extracted tropical sweet pineapple juice served cold', price: 90, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bv-19', categoryId: 'c-15', name: 'Red Bull', description: '[Type: Veg] Standard chilled energy drink can', price: 125, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'bv-20', categoryId: 'c-15', name: 'Diet Coke', description: '[Type: Veg] Carbonated low calorie soft drink can served cold', price: 45, isVeg: true, status: 'Active', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&h=300&q=80' }
      ];

      const mergedCats = [...cats];
      defaultCats.forEach(mockCat => {
        const exists = cats.some((c: any) => c.name.toLowerCase().trim() === mockCat.name.toLowerCase().trim());
        if (!exists) {
          mergedCats.push(mockCat);
        }
      });

      const mergedItems = [...items];
      defaultItems.forEach(mockItem => {
        const mockCatName = defaultCats.find(c => c.id === mockItem.categoryId)?.name || '';
        const targetCat = mergedCats.find(c => c.name.toLowerCase().trim() === mockCatName.toLowerCase().trim());
        if (targetCat) {
          const itemExists = items.some((i: any) => i.name.toLowerCase().trim() === mockItem.name.toLowerCase().trim() && i.categoryId === targetCat.id);
          if (!itemExists) {
            mergedItems.push({
              ...mockItem,
              categoryId: targetCat.id
            });
          }
        }
      });

      setCategories(mergedCats);
      setMenuItems(mergedItems);

      const tbls = await apiRequest(`/restaurant/tables?restaurantId=${user?.restaurantId || 'mock-id'}`);
      if (tbls && tbls.length > 0) {
        setTables(tbls);
        setSelectedTableForPreview(tbls[0]);
      } else {
        const mockT = [
          { id: 't-1', tableNumber: 'Table 1', qrCode: { qrToken: 'QR_TABLE_1' } },
          { id: 't-2', tableNumber: 'Table 2', qrCode: { qrToken: 'QR_TABLE_2' } },
          { id: 't-3', tableNumber: 'Table 3', qrCode: { qrToken: 'QR_TABLE_3' } },
          { id: 't-4', tableNumber: 'Table 4', qrCode: { qrToken: 'QR_TABLE_4' } },
          { id: 't-5', tableNumber: 'Table 5', qrCode: { qrToken: 'QR_TABLE_5' } }
        ];
        setTables(mockT);
        setSelectedTableForPreview(mockT[0]);
      }
    } catch (err) {
      console.warn('Fallback to mock data on error');
      setCategories([
        { id: 'c-1', name: 'Starters', description: 'Crispy finger foods & appetizers' },
        { id: 'c-2', name: 'Soups', description: 'Freshly prepared hot soups' },
        { id: 'c-3', name: 'Veg Main Course', description: 'Gourmet vegetarian entrees' },
        { id: 'c-4', name: 'Non-Veg Main Course', description: 'Authentic chicken & mutton delicacies' },
        { id: 'c-5', name: 'Sea Food', description: 'Fresh catch seafood items' },
        { id: 'c-6', name: 'Rice', description: 'Premium long grain rice & biryanis' },
        { id: 'c-7', name: 'Breads', description: 'Freshly baked tandoori rotis & naans' },
        { id: 'c-8', name: 'Chinese', description: 'Indo-chinese delicacies' },
        { id: 'c-9', name: 'Pizza', description: 'Handmade cheese pizzas' },
        { id: 'c-10', name: 'Burgers', description: 'Juicy customized burgers' },
        { id: 'c-11', name: 'Sandwiches', description: 'Gourmet toasted sandwiches' },
        { id: 'c-12', name: 'Pasta', description: 'Fresh italian pastas' },
        { id: 'c-13', name: 'Desserts', description: 'Delicious sweet endings' },
        { id: 'c-14', name: 'Ice Cream', description: 'Creamy cold ice scoops' },
        { id: 'c-15', name: 'Beverages', description: 'Cold drinks, soda & juices' },
        { id: 'c-16', name: 'Mocktails', description: 'Refreshing mocktails' },
        { id: 'c-17', name: 'Combos', description: 'Value meal combinations' },
        { id: 'c-18', name: "Today's Special", description: 'Special recipes of the day' },
        { id: 'c-19', name: 'Chef Recommendations', description: 'Highly recommended by our chef' }
      ]);
      setMenuItems([
        // ================= VEG ITEMS (20 Items) =================
        { id: 'v-1', categoryId: 'c-3', name: 'Dal Tadka', description: '[Type: Veg] Traditional yellow lentils tempered with ghee, garlic, and cumin', price: 1, isVeg: true, isChefSpecial: false, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-2', categoryId: 'c-3', name: 'Dal Khichadi', description: '[Type: Veg] Comforting rice and lentil porridge tempered with spices', price: 149, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-3', categoryId: 'c-3', name: 'Jeera Rice', description: '[Type: Veg] Aromatic basmati rice tempered with cumin seeds and coriander', price: 120, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-4', categoryId: 'c-3', name: 'Steam Basmati Rice', description: '[Type: Veg] Premium steamed long-grain basmati rice', price: 99, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1596797038530-2c107229654b?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-5', categoryId: 'c-3', name: 'Paneer Butter Masala', description: '[Type: Veg] Soft paneer cubes in creamy, mildly sweet tomato gravy', price: 260, isVeg: true, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-6', categoryId: 'c-3', name: 'Kadai Paneer', description: '[Type: Veg] Paneer cooked with bell peppers and freshly ground kadai spices', price: 250, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-7', categoryId: 'c-3', name: 'Veg Thali', description: '[Type: Veg] Complete meal with dal, two veg curries, rice, chapati, and sweet', price: 199, isVeg: true, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-8', categoryId: 'c-3', name: 'Paneer Tikka Masala', description: '[Type: Veg] Grilled paneer chunks in spicy spiced onion tomato gravy', price: 270, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-9', categoryId: 'c-3', name: 'Mix Vegetable Curry', description: '[Type: Veg] Seasonal mixed vegetables cooked in North Indian style gravy', price: 180, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-10', categoryId: 'c-3', name: 'Chole Bhature', description: '[Type: Veg] Spicy chickpea curry served with two puffed fried breads', price: 150, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1627662236973-4f8259fa2441?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-11', categoryId: 'c-3', name: 'Aloo Gobi Masala', description: '[Type: Veg] Classic dry dish of potatoes and cauliflower with spices', price: 130, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-12', categoryId: 'c-3', name: 'Veg Biryani', description: '[Type: Veg] Layers of basmati rice and mixed vegetables cooked on dum', price: 210, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1563379971899-660589a01cc3?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-13', categoryId: 'c-3', name: 'Masala Dosa', description: '[Type: Veg] Crispy crepe filled with potato masala served with chutney and sambar', price: 99, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-14', categoryId: 'c-3', name: 'Paneer Chilli', description: '[Type: Veg] Indo-Chinese style paneer tossed in soy and green chilli sauce', price: 199, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-15', categoryId: 'c-3', name: 'Veg Hakka Noodles', description: '[Type: Veg] Wok-tossed noodles with colorful garden veggies and soy', price: 160, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-16', categoryId: 'c-3', name: 'Gobi Manchurian', description: '[Type: Veg] Deep-fried cauliflower florets in sweet and tangy sauce', price: 150, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-17', categoryId: 'c-3', name: 'Mushroom Masala', description: '[Type: Veg] Button mushrooms in spiced onion tomato masala gravy', price: 240, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1517244681291-7d930cc7ab3b?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-18', categoryId: 'c-3', name: 'Palak Paneer', description: '[Type: Veg] Creamy cottage cheese cubes in rich spinach sauce', price: 230, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f55e4?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-19', categoryId: 'c-3', name: 'Baingan Bharta', description: '[Type: Veg] Roasted and mashed eggplant cooked with peas and spices', price: 160, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'v-20', categoryId: 'c-3', name: 'Butter Tandoori Roti', description: '[Type: Veg] Whole wheat flatbread baked in tandoor with butter', price: 25, isVeg: true, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&w=400&h=300&q=80' },

        // ================= NON-VEG ITEMS (20 Items) =================
        { id: 'nv-1', categoryId: 'c-4', name: 'Chicken Thali', description: '[Type: Non-Veg] Special thali with Chicken Curry, Egg, Rice, Bhakri, and Solkadhi', price: 249, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-2', categoryId: 'c-4', name: 'Mutton Thali', description: '[Type: Non-Veg] Premium thali with Mutton Masala, Rassa, Rice, Bhakri, and Solkadhi', price: 329, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-3', categoryId: 'c-4', name: 'Chicken Handi (Half)', description: '[Type: Non-Veg] Tender chicken pieces cooked in aromatic spices (Serves 2)', price: 299, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-4', categoryId: 'c-4', name: 'Chicken Handi (Full)', description: '[Type: Non-Veg] Spicy chicken cooked in a handi with rich gravy (Serves 4)', price: 499, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-5', categoryId: 'c-4', name: 'Butter Chicken', description: '[Type: Non-Veg] Tandoori chicken chunks cooked in rich buttery tomato sauce', price: 349, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-6', categoryId: 'c-4', name: 'Chicken Tikka Masala', description: '[Type: Non-Veg] Grilled chicken tikka in spiced curry gravy', price: 320, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-7', categoryId: 'c-4', name: 'Chicken Biryani', description: '[Type: Non-Veg] Long grain basmati rice and layered spiced chicken', price: 280, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1563379971899-660589a01cc3?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-8', categoryId: 'c-4', name: 'Mutton Biryani', description: '[Type: Non-Veg] Premium basmati rice layered with juicy mutton chunks', price: 360, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1563379971899-660589a01cc3?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-9', categoryId: 'c-4', name: 'Mutton Rogan Josh', description: '[Type: Non-Veg] Kashmiri style mutton cooked in yogurt and saffron gravy', price: 380, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-10', categoryId: 'c-4', name: 'Chicken Korma', description: '[Type: Non-Veg] Chicken braised with yogurt, cream, and nut paste', price: 310, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-11', categoryId: 'c-4', name: 'Chicken Tandoori (Half)', description: '[Type: Non-Veg] Clay-oven roasted whole chicken in tandoori red masala', price: 240, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-12', categoryId: 'c-4', name: 'Chicken Tandoori (Full)', description: '[Type: Non-Veg] Full chicken roasted with tandoori spices and mint chutney', price: 420, isVeg: false, isChefSpecial: true, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-13', categoryId: 'c-4', name: 'Chicken Lollipop', description: '[Type: Non-Veg] Deep-fried seasoned chicken wings served with schezwan sauce', price: 220, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-14', categoryId: 'c-4', name: 'Chicken Masala', description: '[Type: Non-Veg] Homestyle thick chicken curry with fresh ground spices', price: 280, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-15', categoryId: 'c-4', name: 'Chicken Kadai', description: '[Type: Non-Veg] Chicken cooked with bell peppers in iron wok', price: 290, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-16', categoryId: 'c-4', name: 'Egg Masala Curry', description: '[Type: Non-Veg] Hard-boiled eggs in onion-tomato based gravy', price: 160, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-17', categoryId: 'c-4', name: 'Chicken Chilli Dry', description: '[Type: Non-Veg] Crispy fried chicken bites with capsicum and dark soy', price: 240, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-18', categoryId: 'c-4', name: 'Chicken Fried Rice', description: '[Type: Non-Veg] Fluffy wok rice tossed with egg, chicken, and green onions', price: 210, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-19', categoryId: 'c-4', name: 'Chicken Shawarma Wrap', description: '[Type: Non-Veg] Shaved grilled chicken wrapped in rumali roti with garlic mayo', price: 120, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'nv-20', categoryId: 'c-4', name: 'Chicken Seekh Kebab', description: '[Type: Non-Veg] Spiced skewered minced chicken rolls baked in tandoor', price: 260, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80' },

        // ================= SEA FOOD ITEMS (20 Items) =================
        { id: 'sf-1', categoryId: 'c-5', name: 'Fish Surmai Fry', description: '[Type: Sea Food] Tawa-fried Surmai steak coated in rava and spice blend', price: 299, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-2', categoryId: 'c-5', name: 'Prawns Masala', description: '[Type: Sea Food] Small prawns cooked in thick spiced coastal gravy', price: 360, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-3', categoryId: 'c-5', name: 'Fish Surmai Thali', description: '[Type: Sea Food] Surmai Fry, Fish Curry, Rice, Solkadhi, and Chapatis', price: 349, isVeg: false, isChefSpecial: true, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-4', categoryId: 'c-5', name: 'Pomfret Fry', description: '[Type: Sea Food] Whole pomfret tawa fried with Konkani green masala', price: 399, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-5', categoryId: 'c-5', name: 'Prawns Koliwada', description: '[Type: Sea Food] Deep-fried crunchy prawns with local batter coating', price: 320, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-6', categoryId: 'c-5', name: 'Fish Curry Goan Style', description: '[Type: Sea Food] Coastal fish cooked in coconut-based tangy tamarind curry', price: 280, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-7', categoryId: 'c-5', name: 'Crab Masala Curry', description: '[Type: Sea Food] Whole mud crabs simmered in hot and spicy gravy', price: 450, isVeg: false, isChefSpecial: true, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-8', categoryId: 'c-5', name: 'Butter Garlic Prawns', description: '[Type: Sea Food] Juicy prawns tossed in garlic butter with black pepper', price: 380, isVeg: false, isChefSpecial: false, isRecommended: true, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-9', categoryId: 'c-5', name: 'Lobster Thermidor', description: '[Type: Sea Food] Gourmet lobster meat cooked in creamy wine sauce with cheese', price: 999, isVeg: false, isChefSpecial: true, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-10', categoryId: 'c-5', name: 'Fish Tikka', description: '[Type: Sea Food] Tandoor roasted boneless fish chunks with tikka marinade', price: 320, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-11', categoryId: 'c-5', name: 'Squid Chilli Dry', description: '[Type: Sea Food] Tossed squid rings with bell peppers, green chillies, and soy', price: 260, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-12', categoryId: 'c-5', name: 'Tandoori Pomfret', description: '[Type: Sea Food] Whole pomfret marinated in tandoori spice blend and charcoal-baked', price: 420, isVeg: false, isChefSpecial: true, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-13', categoryId: 'c-5', name: 'Prawns Dum Biryani', description: '[Type: Sea Food] Spiced prawns dum-cooked with long grain basmati rice', price: 340, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1563379971899-660589a01cc3?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-14', categoryId: 'c-5', name: 'Fish Chilli Gravy', description: '[Type: Sea Food] Boneless fish chunks tossed in thick spicy soy gravy', price: 280, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-15', categoryId: 'c-5', name: 'Oysters Rockefeller', description: '[Type: Sea Food] Baked oysters topped with butter, herbs, and breadcrumbs', price: 599, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-16', categoryId: 'c-5', name: 'Seafood Hot Soup', description: '[Type: Sea Food] Hot and sour broth with mixed prawns, crab meat, and squid', price: 149, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-17', categoryId: 'c-5', name: 'Bombil Rava Fry', description: '[Type: Sea Food] Crisp fried Bombay Duck coated with seasoned semolina', price: 199, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-18', categoryId: 'c-5', name: 'Seafood Fried Rice', description: '[Type: Sea Food] Long grain rice wok-tossed with fresh prawns and squid bits', price: 240, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-19', categoryId: 'c-5', name: 'Fish Fingers', description: '[Type: Sea Food] Crumbed and deep-fried fish strips served with tartar sauce', price: 220, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' },
        { id: 'sf-20', categoryId: 'c-5', name: 'Prawns Fry Tawa', description: '[Type: Sea Food] Fresh prawns pan-fried in ginger-garlic and red chilli paste', price: 290, isVeg: false, isChefSpecial: false, isRecommended: false, status: 'Active', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80' }
      ]);
      const mockT = [
        { id: 't-1', tableNumber: 'Table 1', qrCode: { qrToken: 'QR_TABLE_1' } },
        { id: 't-2', tableNumber: 'Table 2', qrCode: { qrToken: 'QR_TABLE_2' } },
        { id: 't-3', tableNumber: 'Table 3', qrCode: { qrToken: 'QR_TABLE_3' } },
        { id: 't-4', tableNumber: 'Table 4', qrCode: { qrToken: 'QR_TABLE_4' } },
        { id: 't-5', tableNumber: 'Table 5', qrCode: { qrToken: 'QR_TABLE_5' } }
      ];
      setTables(mockT);
      setSelectedTableForPreview(mockT[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuData();
    const savedConfig = localStorage.getItem(`restaurant_menu_config_${user?.restaurantId || 'mock-id'}`);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.logoUrl) setLogoUrl(parsed.logoUrl);
        if (parsed.coverUrl) setCoverUrl(parsed.coverUrl);
        if (parsed.themeColor) setThemeColor(parsed.themeColor);
        if (parsed.welcomeMsg) setWelcomeMsg(parsed.welcomeMsg);
        if (parsed.enableSpiceLevels !== undefined) setEnableSpiceLevels(parsed.enableSpiceLevels);
      } catch (e) {
        console.error(e);
      }
    }
  }, [user]);

  useEffect(() => {
    const iframe = document.querySelector('iframe[title="Customer Menu Preview"]') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'MENU_ITEMS_UPDATE',
        categories,
        menuItems
      }, '*');
    }
  }, [categories, menuItems]);

  const saveCustomizerConfig = (updated: any) => {
    const newConfig = {
      logoUrl: updated.logoUrl !== undefined ? updated.logoUrl : logoUrl,
      coverUrl: updated.coverUrl !== undefined ? updated.coverUrl : coverUrl,
      themeColor: updated.themeColor !== undefined ? updated.themeColor : themeColor,
      welcomeMsg: updated.welcomeMsg !== undefined ? updated.welcomeMsg : welcomeMsg,
      enableSpiceLevels: updated.enableSpiceLevels !== undefined ? updated.enableSpiceLevels : enableSpiceLevels
    };
    localStorage.setItem(`restaurant_menu_config_${user?.restaurantId || 'mock-id'}`, JSON.stringify(newConfig));

    // Instantly notify the iframe without needing a refresh
    const iframe = document.querySelector('iframe[title="Customer Menu Preview"]') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'MENU_CONFIG_UPDATE',
        config: newConfig
      }, '*');
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      await apiRequest('/restaurant/menu/categories', {
        method: 'POST',
        body: JSON.stringify({
          restaurantId: user?.restaurantId || 'mock-id',
          name: newCatName,
          description: newCatDesc,
          sortOrder: categories.length + 1
        })
      });
      setNewCatName('');
      setNewCatDesc('');
      setShowCatModal(false);
      fetchMenuData();
    } catch (err) {
      setCategories(prev => [
        ...prev,
        { id: `c-${Date.now()}`, name: newCatName, description: newCatDesc }
      ]);
      setNewCatName('');
      setNewCatDesc('');
      setShowCatModal(false);
    }
  };

  const parseFoodTypeAndDescription = (item: any) => {
    const description = item.description || '';
    let type = item.isVeg ? 'Veg' : 'Non-Veg';
    let cleanDesc = description;
    const match = description?.match(/\[Type:\s*(Veg|Non-Veg|Sea Food)\]/);
    if (match) {
      type = match[1];
      cleanDesc = description.replace(/\[Type:\s*(Veg|Non-Veg|Sea Food)\]/, '').trim();
    } else {
      const nameLower = (item.name || '').toLowerCase();
      const descLower = cleanDesc.toLowerCase();
      if (nameLower.includes('fish') || nameLower.includes('prawn') || nameLower.includes('sea') || nameLower.includes('crab') || nameLower.includes('lobster') || descLower.includes('fish') || descLower.includes('prawn') || descLower.includes('seafood')) {
        type = 'Sea Food';
      }
    }
    return { type, cleanDesc };
  };

  const handleEditClick = (item: any) => {
    setEditingItem(item);
    setSelectedCategoryId(item.categoryId);
    setNewItemName(item.name);
    const { type, cleanDesc } = parseFoodTypeAndDescription(item);
    setNewItemDesc(cleanDesc);
    setNewItemPrice(String(item.price));
    setNewItemImage(item.image || '');
    if (item.image) {
      const parts = item.image.split('/');
      setNewItemImageName(parts[parts.length - 1] || 'Current Image');
    } else {
      setNewItemImageName('');
    }
    setFoodType(type);
    setNewItemIsChefSpecial(item.isChefSpecial);
    setNewItemIsRecommended(item.isRecommended);
    setNewItemIsOnOffer(item.isOnOffer);
    setNewItemOfferPrice(item.offerPrice ? String(item.offerPrice) : '');
    setAddons(item.addons || []);
    setShowItemModal(true);
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await apiRequest(`/restaurant/menu/items/${id}`, {
        method: 'DELETE'
      });
      fetchMenuData();
    } catch (err) {
      setMenuItems(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !selectedCategoryId || !newItemPrice) return;

    const finalDescription = `[Type: ${foodType}] ${newItemDesc}`;

    const body = {
      categoryId: selectedCategoryId,
      name: newItemName,
      description: finalDescription,
      price: Number(newItemPrice),
      image: newItemImage || '',
      isVeg: foodType === 'Veg',
      isChefSpecial: newItemIsChefSpecial,
      isRecommended: newItemIsRecommended,
      isOnOffer: newItemIsOnOffer,
      offerPrice: newItemOfferPrice ? Number(newItemOfferPrice) : null,
      addons: addons.map(addon => ({
        name: addon.name,
        price: Number(addon.price) || 0,
        category: addon.category || 'Add-ons',
        maxQty: Number(addon.maxQty) || 1,
        isOptional: addon.isOptional !== undefined ? Boolean(addon.isOptional) : true
      }))
    };

    try {
      if (editingItem) {
        await apiRequest(`/restaurant/menu/items/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(body)
        });
      } else {
        await apiRequest('/restaurant/menu/items', {
          method: 'POST',
          body: JSON.stringify(body)
        });
      }
      setShowItemModal(false);
      setNewItemName('');
      setNewItemDesc('');
      setNewItemPrice('');
      setNewItemImage('');
      setNewItemImageName('');
      setFoodType('Veg');
      setNewItemIsChefSpecial(false);
      setNewItemIsRecommended(false);
      setNewItemIsOnOffer(false);
      setNewItemOfferPrice('');
      setAddons([]);
      setEditingItem(null);
      fetchMenuData();
    } catch (err) {
      if (editingItem) {
        setMenuItems(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...body, id: editingItem.id, price: Number(newItemPrice), isVeg: foodType === 'Veg' } : item));
      } else {
        setMenuItems(prev => [
          ...prev,
          {
            id: `mi-${Date.now()}`,
            categoryId: selectedCategoryId,
            name: newItemName,
            description: finalDescription,
            price: Number(newItemPrice),
            image: newItemImage || '',
            isVeg: foodType === 'Veg',
            isChefSpecial: newItemIsChefSpecial,
            isRecommended: newItemIsRecommended,
            isOnOffer: newItemIsOnOffer,
            offerPrice: newItemOfferPrice ? Number(newItemOfferPrice) : null,
            addons: body.addons,
            status: 'Active'
          }
        ]);
      }
      setShowItemModal(false);
      setNewItemName('');
      setNewItemDesc('');
      setNewItemPrice('');
      setNewItemImage('');
      setNewItemImageName('');
      setFoodType('Veg');
      setNewItemIsChefSpecial(false);
      setNewItemIsRecommended(false);
      setNewItemIsOnOffer(false);
      setNewItemOfferPrice('');
      setAddons([]);
      setEditingItem(null);
    }
  };

  const getFoodImage = (item: any) => {
    if (item.image && !item.image.includes('unsplash.com/photo-1504674900247-0877df9cc836')) {
      return item.image;
    }
    const name = item.name?.toLowerCase() || '';
    if (name.includes('veg crispy') || name.includes('crispy veg')) return 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('paneer tikka') || name.includes('paneer')) return 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('pomfret') || name.includes('fish fry') || name.includes('pomfret fry')) return 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('biryani')) return 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('pizza')) return 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('garlic bread')) return 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('soup') || name.includes('tomato')) return 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('fish') || name.includes('prawn') || name.includes('sea') || name.includes('seafood')) return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('chicken') || name.includes('mutton') || name.includes('curry')) return 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('naan') || name.includes('roti') || name.includes('bread')) return 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('noodle') || name.includes('chinese') || name.includes('manchurian')) return 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('sandwich')) return 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('pasta')) return 'https://images.unsplash.com/photo-1563379971899-660589a01cc3?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('ice cream') || name.includes('scoop')) return 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('dessert') || name.includes('cake') || name.includes('sweet') || name.includes('brownie')) return 'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('mocktail') || name.includes('mojito') || name.includes('lagoon')) return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('coffee') || name.includes('tea') || name.includes('beverage') || name.includes('coke') || name.includes('drink')) return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=400&h=300&q=80';
    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=400&h=300&q=80';
  };

  const handlePrintQR = (table: any, mode: 'card' | 'stand' | 'tent') => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
      `${window.location.origin}/public/menu/${table.qrCode?.qrToken || 'MOCK_QR'}`
    )}`;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    let contentHtml = '';

    if (mode === 'card') {
      contentHtml = `
        <div style="border: 4px solid #10b981; border-radius: 24px; padding: 30px; text-align: center; max-width: 350px; margin: 40px auto; font-family: 'Inter', sans-serif; background-color: #070a13; color: white; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <div style="font-size: 11px; font-weight: 800; color: #10b981; letter-spacing: 2px; text-transform: uppercase;">Scan To Order</div>
          <h2 style="margin: 10px 0 20px 0; font-size: 24px; font-weight: 800;">${user?.businessName || 'Gourmet Bistro'}</h2>
          <div style="background-color: white; padding: 15px; border-radius: 16px; display: inline-block; margin-bottom: 20px;">
            <img src="${qrUrl}" alt="QR Code" style="display: block; width: 180px; height: 180px;" />
          </div>
          <div style="font-size: 32px; font-weight: 900; color: #10b981; margin-bottom: 10px;">${table.tableNumber}</div>
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">Scan & Order Food Directly From Your Phone</p>
        </div>
      `;
    } else if (mode === 'stand') {
      contentHtml = `
        <div style="border: 2px solid #ccc; width: 400px; height: 600px; padding: 20px; box-sizing: border-box; text-align: center; margin: 20px auto; font-family: sans-serif; display: flex; flex-direction: column; justify-content: space-between; border-radius: 12px;">
          <div>
            <h1 style="font-size: 28px; margin-bottom: 5px;">${user?.businessName || 'Gourmet Bistro'}</h1>
            <p style="color: #666; margin: 0; font-size: 14px;">Premium Dine-In Experience</p>
          </div>
          <div>
            <span style="font-weight: bold; letter-spacing: 1px; color: #10b981; font-size: 12px;">SCAN TO BROWSE MENU</span>
            <div style="margin: 20px 0;">
              <img src="${qrUrl}" style="width: 200px; height: 200px; border: 1px solid #eee; padding: 5px; border-radius: 8px;" />
            </div>
            <h2 style="font-size: 36px; margin: 0; color: #333;">${table.tableNumber}</h2>
          </div>
          <div style="font-size: 12px; color: #888; border-top: 1px dashed #ddd; padding-top: 15px;">
            No login or app install required. Place order and pay directly.
          </div>
        </div>
      `;
    } else {
      contentHtml = `
        <div style="width: 600px; margin: 40px auto; font-family: sans-serif; border: 1px solid #aaa; border-radius: 8px; overflow: hidden;">
          <div style="display: flex; height: 400px;">
            <div style="flex: 1; border-right: 2px dashed #999; padding: 30px; display: flex; flex-direction: column; justify-content: center; text-align: center; background-color: #fafafa; transform: rotate(180deg);">
              <h3 style="margin: 0 0 10px 0; font-size: 18px;">${user?.businessName || 'Gourmet Bistro'}</h3>
              <p style="font-size: 11px; color: #777;">${table.tableNumber}</p>
              <div style="margin: 15px 0;"><img src="${qrUrl}" style="width: 120px; height: 120px;" /></div>
              <span style="font-size: 10px; font-weight: bold; color: #10b981;">SCAN TO ORDER</span>
            </div>
            <div style="flex: 1; padding: 30px; display: flex; flex-direction: column; justify-content: center; text-align: center; background-color: #fff;">
              <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #111;">${user?.businessName || 'Gourmet Bistro'}</h3>
              <p style="font-size: 11px; color: #777;">${table.tableNumber}</p>
              <div style="margin: 15px 0;"><img src="${qrUrl}" style="width: 120px; height: 120px;" /></div>
              <span style="font-size: 10px; font-weight: bold; color: #10b981;">SCAN TO ORDER</span>
            </div>
          </div>
          <div style="background-color: #eee; text-align: center; padding: 10px; font-size: 12px; font-weight: bold; color: #666; border-top: 2px dashed #999;">
            FOLD HERE TO CREATE TABLE TENT STAND
          </div>
        </div>
      `;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR - ${table.tableNumber}</title>
          <style>
            body { margin: 0; background-color: #f3f4f6; padding: 20px; }
            @media print {
              body { background-color: white; padding: 0; }
              button { display: none; }
            }
          </style>
        </head>
        <body>
          <div style="text-align: center; margin-bottom: 20px; padding: 10px;">
            <button onclick="window.print()" style="background-color: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              🖨️ Print Now
             </button>
          </div>
          ${contentHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
            <span>Digital Menu Studio</span>
            <span className="bg-emerald-50 text-emerald-600 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase border border-emerald-100">Active</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Design a premium restaurant menu card experience and manage QR prints</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-px">
        {[
          { key: 'menu', label: 'Menu Catalog', icon: Layers },
          { key: 'qr', label: 'QR Print Center', icon: QrCode },
          { key: 'customizer', label: 'Theme Customizer', icon: Paintbrush }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`py-3 px-5 border-b-2 font-bold text-sm flex items-center gap-2 transition-all -mb-px ${activeTab === tab.key
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
          >
            <tab.icon className="w-4.5 h-4.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:h-[710px] items-stretch overflow-hidden">
        <div className="lg:col-span-7 h-full flex flex-col overflow-hidden">
          <div className="flex-grow overflow-y-auto pr-2 pb-6 scrollbar-none space-y-6">
            {activeTab === 'menu' && (
              <div className="space-y-6">
                {/* Header card with action buttons */}
                <div className="bg-white rounded-3xl border border-slate-200/60 p-5 shadow-sm flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">Menu Catalog</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Manage and organize your categories and dishes</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowCatModal(true)} className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 text-xs transition-all">
                      <Plus className="w-3.5 h-3.5" /> <span>Category</span>
                    </button>
                    <button onClick={() => { if (categories.length > 0) setSelectedCategoryId(categories[0].id); setShowItemModal(true); }} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3.5 rounded-xl flex items-center gap-1.5 text-xs shadow-md shadow-emerald-600/15 transition-all">
                      <Plus className="w-3.5 h-3.5" /> <span>Menu Item</span>
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div></div>
                ) : (
                  <div className="space-y-6">
                    {/* Category List Selector */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Categories Catalog</span>
                        {selectedCategoryFilter !== 'ALL' && (
                          <button onClick={() => setSelectedCategoryFilter('ALL')} className="text-xs text-emerald-600 hover:text-emerald-700 font-bold">Clear Filter</button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {/* All card */}
                        <div
                          onClick={() => setSelectedCategoryFilter('ALL')}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all duration-200 select-none flex flex-col justify-between h-[68px] ${
                            selectedCategoryFilter === 'ALL'
                              ? 'bg-emerald-50/70 border-emerald-500 text-emerald-900 shadow-sm shadow-emerald-500/5 ring-1 ring-emerald-500/30'
                              : 'bg-white border-slate-200/80 hover:border-emerald-300 text-slate-800 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex justify-between items-center gap-1.5">
                            <span className={`text-[10.5px] font-extrabold uppercase tracking-wider truncate ${selectedCategoryFilter === 'ALL' ? 'text-emerald-900' : 'text-slate-800'}`}>All Dishes</span>
                            <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                              Active
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 mt-1">
                            <span>{menuItems.length} Items</span>
                          </div>
                        </div>

                        {/* Custom Category cards */}
                        {categories.map(cat => {
                          const items = menuItems.filter(item => item.categoryId === cat.id);
                          const isSelected = selectedCategoryFilter === cat.id;
                          return (
                            <div
                              key={cat.id}
                              onClick={() => setSelectedCategoryFilter(cat.id)}
                              className={`p-2.5 rounded-xl border cursor-pointer transition-all duration-200 select-none flex flex-col justify-between h-[68px] ${
                                isSelected
                                  ? 'bg-emerald-50/70 border-emerald-500 text-emerald-900 shadow-sm shadow-emerald-500/5 ring-1 ring-emerald-500/30'
                                  : 'bg-white border-slate-200/80 hover:border-emerald-300 text-slate-800 hover:shadow-sm'
                              }`}
                            >
                              <div className="flex justify-between items-center gap-1.5">
                                <span className={`text-[10.5px] font-extrabold uppercase tracking-wider truncate ${isSelected ? 'text-emerald-900' : 'text-slate-800'}`}>{cat.name}</span>
                                <span className="text-[9px] font-bold text-emerald-600 flex items-center gap-1 shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                                  Active
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] font-semibold text-slate-500 mt-1">
                                <span>{items.length} Items</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Food Items Catalog list */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Dishes & Recipe List</span>
                      </div>

                      {(() => {
                        const filtered = selectedCategoryFilter === 'ALL'
                          ? menuItems
                          : menuItems.filter(item => item.categoryId === selectedCategoryFilter);

                        if (filtered.length === 0) {
                          return (
                            <div className="bg-white rounded-3xl border border-slate-200/60 p-8 text-center shadow-sm">
                              <p className="text-xs text-slate-400 font-medium italic">No food items found in this category.</p>
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filtered.map(item => {
                              const { type, cleanDesc } = parseFoodTypeAndDescription(item);
                              const cat = categories.find(c => c.id === item.categoryId);
                              return (
                                <div key={item.id} className="bg-white rounded-3xl border border-slate-200/60 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group">
                                  <div className="relative h-44 w-full bg-slate-50 overflow-hidden shrink-0">
                                    <img src={getFoodImage(item)} alt={item.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                    <div className="absolute top-3 left-3 flex gap-1.5">
                                      {type === 'Veg' ? (
                                        <span className="inline-flex items-center justify-center w-[18px] h-[18px] border-2 border-emerald-600 rounded bg-white p-[2px] shadow-sm shrink-0">
                                          <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center justify-center w-[18px] h-[18px] border-2 border-red-600 rounded bg-white p-[2px] shadow-sm shrink-0">
                                          <span className="w-2 h-2 rounded-full bg-red-600"></span>
                                        </span>
                                      )}
                                      <span className="text-[9px] font-black uppercase tracking-wider bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded-full shadow-sm text-slate-800">
                                        {cat?.name || 'Dish'}
                                      </span>
                                    </div>
                                    <div className="absolute bottom-3 right-3">
                                      <span className="text-[8.5px] font-extrabold uppercase tracking-widest bg-emerald-500 text-white px-2 py-0.5 rounded-full shadow-sm">
                                        Available
                                      </span>
                                    </div>
                                  </div>
                                  <div className="p-4 flex-grow flex flex-col justify-between space-y-3">
                                    <div>
                                      <h5 className="font-extrabold text-slate-800 text-sm tracking-tight line-clamp-1">{item.name}</h5>
                                      <p className="text-[10.5px] text-slate-500 mt-1 line-clamp-2 leading-relaxed font-medium">{cleanDesc || 'Standard restaurant recipe prepared fresh.'}</p>
                                    </div>
                                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                                      <div>
                                        {item.isOnOffer && item.offerPrice ? (
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-[10px] text-slate-400 line-through">₹{item.price}</span>
                                            <span className="text-sm font-black text-emerald-600">₹{item.offerPrice}</span>
                                          </div>
                                        ) : (
                                          <span className="text-sm font-black text-slate-800">₹{item.price}</span>
                                        )}
                                      </div>
                                      <div className="flex gap-2">
                                        <button onClick={() => handleEditClick(item)} className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-extrabold uppercase tracking-wider transition-all">
                                          Edit
                                        </button>
                                        <button onClick={() => handleDeleteMenuItem(item.id)} className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 text-[10px] font-extrabold uppercase tracking-wider transition-all">
                                          Delete
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'qr' && (
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm space-y-6">
                <div className="pb-4 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-800 text-base">Table QR Print Management</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Generate, customize, and print high-quality physical tables standees</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {tables.map(table => {
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/public/menu/${table.qrCode?.qrToken || 'MOCK_QR'}`)}`;
                    return (
                      <div key={table.id} className="border border-slate-200/80 rounded-2xl p-5 bg-slate-50/30 text-center space-y-4 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Dine-in Order QR</span>
                          <h4 className="font-extrabold text-slate-800 text-lg mt-0.5">{table.tableNumber}</h4>
                        </div>
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 inline-block mx-auto shadow-sm"><img src={qrUrl} alt="QR Code" className="w-32 h-32 mx-auto" /></div>
                        <div className="space-y-2 pt-2">
                          <div className="flex gap-2">
                            <button onClick={() => handlePrintQR(table, 'card')} className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"><Printer className="w-3.5 h-3.5" /> <span>Print Card</span></button>
                            <a href={qrUrl} download={`${table.tableNumber}_QR.png`} target="_blank" rel="noreferrer" className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"><Download className="w-3.5 h-3.5" /> <span>Download</span></a>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handlePrintQR(table, 'stand')} className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold py-2 px-3 rounded-xl text-[10px] flex items-center justify-center gap-1.5 transition-all"><span>Table Standee</span></button>
                            <button onClick={() => handlePrintQR(table, 'tent')} className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold py-2 px-3 rounded-xl text-[10px] flex items-center justify-center gap-1.5 transition-all"><span>Folding Tent</span></button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'customizer' && (
              <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm space-y-6">
                <div className="pb-4 border-b border-slate-100">
                  <h3 className="font-extrabold text-slate-800 text-base">Menu Card Customizer</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Customize cover images, headers, logo, and active branding messages</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Theme Color Preset</label>
                    <div className="flex gap-3">
                      {[
                        { key: 'emerald', color: 'bg-emerald-600', name: 'Emerald' },
                        { key: 'amber', color: 'bg-amber-500', name: 'Gilded Amber' },
                        { key: 'rose', color: 'bg-rose-500', name: 'Rose Petal' },
                        { key: 'indigo', color: 'bg-indigo-600', name: 'Royal Indigo' },
                        { key: 'violet', color: 'bg-violet-600', name: 'Velvet Violet' }
                      ].map((theme) => (
                        <button key={theme.key} type="button" onClick={() => { setThemeColor(theme.key); saveCustomizerConfig({ themeColor: theme.key }); }} className={`flex-1 py-3 rounded-xl border flex flex-col items-center gap-2 font-bold text-[10px] uppercase transition-all ${themeColor === theme.key ? 'border-emerald-600 bg-slate-50 shadow-sm' : 'border-slate-200 hover:bg-slate-50/50'}`}><span className={`w-5 h-5 rounded-full ${theme.color} shadow-inner`}></span> <span>{theme.name}</span></button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Upload Restaurant Logo</label>
                    <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { const b64 = reader.result as string; setLogoUrl(b64); saveCustomizerConfig({ logoUrl: b64 }); }; reader.readAsDataURL(file); } }} className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-600 bg-slate-50/50" />
                    {logoUrl && <img src={logoUrl} alt="Logo Preview" className="mt-2 w-16 h-16 object-cover rounded-lg border" />}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Upload Restaurant Cover Banner</label>
                    <input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { const b64 = reader.result as string; setCoverUrl(b64); saveCustomizerConfig({ coverUrl: b64 }); }; reader.readAsDataURL(file); } }} className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-600 bg-slate-50/50" />
                    {coverUrl && <img src={coverUrl} alt="Banner Preview" className="mt-2 h-20 w-full object-cover rounded-lg border" />}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Welcome Text</label>
                    <input type="text" value={welcomeMsg} onChange={(e) => { setWelcomeMsg(e.target.value); saveCustomizerConfig({ welcomeMsg: e.target.value }); }} placeholder="Branding greeting card text..." className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-600 bg-slate-50/50" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Enable Spice Levels</label>
                      <p className="text-[10px] text-slate-500 font-medium mt-0.5">Show Mild/Medium/Hot selections on food details screen</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={enableSpiceLevels}
                      onChange={(e) => {
                        setEnableSpiceLevels(e.target.checked);
                        saveCustomizerConfig({ enableSpiceLevels: e.target.checked });
                      }}
                      className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 sticky top-6 lg:-ml-6 lg:mr-2">
          <div className="bg-white rounded-3xl border border-slate-200/60 p-4 lg:p-6 shadow-sm space-y-6">
            <div className="flex flex-col items-start gap-1">
              <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" /> <span>Customer Menu Simulator</span></span>
              <h3 className="font-extrabold text-slate-800 text-sm">Interactive QR Preview</h3>
            </div>
            <div className="w-[430px] max-w-full h-[600px] bg-slate-950 rounded-[38px] p-3 shadow-2xl border-4 border-slate-800 relative overflow-hidden flex flex-col justify-between mx-auto">
              <div className="absolute top-0 inset-x-0 h-4 bg-slate-950 z-50 flex justify-center items-center"><div className="w-16 h-3 bg-slate-950 rounded-b-lg border-x border-b border-slate-900"></div></div>
              <div className="w-full h-full rounded-[26px] overflow-hidden bg-white">
                <iframe
                  src={`/public/menu/${selectedTableForPreview?.qrCode?.qrToken || 'MOCK_QR'}?theme=${themeColor}&logo=${logoUrl.startsWith('data:') ? '' : encodeURIComponent(logoUrl)}&cover=${coverUrl.startsWith('data:') ? '' : encodeURIComponent(coverUrl)}&welcome=${encodeURIComponent(welcomeMsg)}&spice=${enableSpiceLevels}&restId=${user?.restaurantId || 'mock-id'}`}
                  className="w-full h-full border-none"
                  title="Customer Menu Preview"
                  onLoad={(e) => {
                    const iframeWin = (e.target as HTMLIFrameElement).contentWindow;
                    if (iframeWin) {
                      iframeWin.postMessage({
                        type: 'MENU_ITEMS_UPDATE',
                        categories,
                        menuItems
                      }, '*');
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCatModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-slate-200 p-6 animate-fade-in">
            <h3 className="font-extrabold text-slate-800 text-lg mb-4">Add Menu Category</h3>
            <form onSubmit={handleAddCategory} className="space-y-4 text-left">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Starters, Main Course"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Description</label>
                <textarea
                  placeholder="Appetizers, beverages..."
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-600 bg-slate-50/50 h-20"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs shadow-lg transition-colors"
                >
                  Save Category
                </button>
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showItemModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 animate-fade-in max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-slate-800 text-lg mb-4">{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h3>
            <form onSubmit={handleAddMenuItem} className="space-y-4 text-left">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Category</label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                  >
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Food Type</label>
                  <select
                    value={foodType}
                    onChange={(e) => setFoodType(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                  >
                    <option value="Veg">Veg</option>
                    <option value="Non-Veg">Non-Veg</option>
                    <option value="Sea Food">Sea Food</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Upload Dish Image</label>
                  <div className="relative">
                    <label className="flex items-center gap-2 border border-slate-300 rounded-xl px-3 py-1.5 text-sm bg-slate-50/50 cursor-pointer hover:border-emerald-600 transition-colors min-h-[38px]">
                      <span className="text-slate-500 truncate max-w-[200px] flex-1 text-xs text-left">
                        {newItemImageName || 'Choose image file...'}
                      </span>
                      {newItemImage ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setNewItemImage('');
                            setNewItemImageName('');
                          }}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full w-4.5 h-4.5 flex items-center justify-center text-[8px] font-bold shrink-0"
                        >
                          ✕
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 shrink-0">Browse</span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setNewItemImageName(file.name);
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewItemImage(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Description</label>
                <textarea
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-600 bg-slate-50/50 h-16"
                />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newItemIsChefSpecial} onChange={(e) => setNewItemIsChefSpecial(e.target.checked)} className="rounded text-emerald-600" />
                  <span className="text-xs font-bold text-slate-700">Chef Special</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newItemIsRecommended} onChange={(e) => setNewItemIsRecommended(e.target.checked)} className="rounded text-emerald-600" />
                  <span className="text-xs font-bold text-slate-700">Recommended</span>
                </label>
              </div>
              <div className="border-t pt-3 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={newItemIsOnOffer} onChange={(e) => setNewItemIsOnOffer(e.target.checked)} className="rounded text-emerald-600" />
                  <span className="text-xs font-bold text-slate-700">Set Promotional Offer</span>
                </label>
                {newItemIsOnOffer && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">Offer Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={newItemOfferPrice}
                      onChange={(e) => setNewItemOfferPrice(e.target.value)}
                      className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-600 bg-slate-50/50"
                    />
                  </div>
                )}
              </div>
              <div className="border-t pt-3 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Available Add-ons</label>
                  <button type="button" onClick={handleAddAddonRow} className="text-emerald-600 hover:text-emerald-700 text-xs font-bold flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" /> Add Row
                  </button>
                </div>

                {addons.length > 0 ? (
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-1 border border-slate-100 p-2 rounded-xl bg-slate-50/30">
                    {addons.map((addon, index) => (
                      <div key={index} className="bg-white border rounded-xl p-3 space-y-2 shadow-sm relative text-xs">
                        <button
                          type="button"
                          onClick={() => handleRemoveAddon(index)}
                          className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs font-bold"
                        >
                          ✕
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <input
                              type="text"
                              required
                              placeholder="Name (e.g. Extra Cheese)"
                              value={addon.name}
                              onChange={(e) => handleUpdateAddon(index, 'name', e.target.value)}
                              className="w-full border rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-emerald-600"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              required
                              placeholder="Price (₹)"
                              value={addon.price || ''}
                              onChange={(e) => handleUpdateAddon(index, 'price', e.target.value)}
                              className="w-full border rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-emerald-600"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 items-center">
                          <div>
                            <input
                              type="text"
                              placeholder="Category (e.g. Cheese)"
                              value={addon.category || ''}
                              onChange={(e) => handleUpdateAddon(index, 'category', e.target.value)}
                              className="w-full border rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-emerald-600"
                            />
                          </div>
                          <div>
                            <input
                              type="number"
                              placeholder="Max Qty"
                              value={addon.maxQty || 1}
                              onChange={(e) => handleUpdateAddon(index, 'maxQty', e.target.value)}
                              className="w-full border rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-emerald-600"
                            />
                          </div>
                          <div className="flex items-center gap-1 justify-end">
                            <input
                              type="checkbox"
                              checked={addon.isOptional}
                              onChange={(e) => handleUpdateAddon(index, 'isOptional', e.target.checked)}
                              className="rounded text-emerald-600 w-3 h-3"
                              id={`opt-${index}`}
                            />
                            <label htmlFor={`opt-${index}`} className="text-[10px] text-slate-500 cursor-pointer font-semibold">Optional</label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 font-medium italic">No custom add-ons configured for this dish.</p>
                )}
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs transition-colors">{editingItem ? 'Update Item' : 'Save Item'}</button>
                <button type="button" onClick={() => { setShowItemModal(false); setEditingItem(null); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-xs transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
