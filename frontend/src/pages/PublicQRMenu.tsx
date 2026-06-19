import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Check,
  Clock,
  Loader2
} from 'lucide-react';

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

export const PublicQRMenu: React.FC = () => {
  const { qrToken } = useParams<{ qrToken: string }>();
  const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:5000/api'
    : `${window.location.protocol}//${window.location.hostname}:5000/api`;
  const [menu, setMenu] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Customizer styling preset states
  const [logoUrl, setLogoUrl] = useState('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=120&h=120&q=80');
  const [coverUrl, setCoverUrl] = useState('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&h=400&q=80');
  const [themeColor, setThemeColor] = useState('emerald'); // emerald, amber, rose, indigo, violet
  const [welcomeMsg, setWelcomeMsg] = useState('Welcome to our restaurant! Scan the QR to browse our gourmet dishes.');
  const [enableSpiceLevels, setEnableSpiceLevels] = useState(false);

  // Simulated screens state machine
  const [screen, setScreen] = useState<'menu' | 'details' | 'upsell' | 'cart' | 'summary' | 'customer_details' | 'payment' | 'status' | 'billing' | 'razorpay' | 'invoice' | 'confirmation' | 'payment_failed'>('menu');
  const [foodFilter, setFoodFilter] = useState<'All' | 'Veg' | 'Non-Veg' | 'Sea Food'>('Veg');
  const [selectedCategory, setSelectedCategory] = useState<string>('');



  // Cart and product details states
  const [cart, setCart] = useState<{ item: any; quantity: number; notes: string; selectedAddOns: any[]; spiceLevel?: string }[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailQty, setDetailQty] = useState(1);
  const [detailNotes, setDetailNotes] = useState('');
  const [spiceLevel, setSpiceLevel] = useState<'Mild' | 'Medium' | 'Hot'>('Medium');
  const [selectedAddOns, setSelectedAddOns] = useState<any[]>([]);
  const [addedToCartState, setAddedToCartState] = useState(false);

  // Customer Details
  const [customerName, setCustomerName] = useState('Dine-in Customer');
  const [customerMobile, setCustomerMobile] = useState('0000000000');
  const [customerEmail, setCustomerEmail] = useState('dinein@customer.local');
  const [searchQuery, setSearchQuery] = useState('');

  // Payment option
  const paymentOption = 'Razorpay';

  // Order transaction states
  const [orderPlaced, setOrderPlaced] = useState<any>(null);
  const [trackStatus, setTrackStatus] = useState<'ORDER RECEIVED' | 'COOKING' | 'READY' | 'SERVED'>('ORDER RECEIVED');
  const [estTimeRemaining, setEstTimeRemaining] = useState<number | null>(null);
  const [razorpayMethod, setRazorpayMethod] = useState<'UPI' | 'Card' | 'Net' | 'Wallet' | 'QR'>('QR');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [cartNotification, setCartNotification] = useState<string | null>(null);

  const [selectedUPIApp, setSelectedUPIApp] = useState<string>('GPay');
  const [selectedBank, setSelectedBank] = useState<string>('SBI');
  const [selectedWalletOption, setSelectedWalletOption] = useState<string>('Paytm');
  const [cardNumber, setCardNumber] = useState<string>('4321 8876 5432 1098');
  const [cardExpiry, setCardExpiry] = useState<string>('12/29');
  const [cardCVV, setCardCVV] = useState<string>('123');

  // Explicit state variables for payment method state management
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('QR');
  const [selectedUPI, setSelectedUPI] = useState<string>('GPay');
  const [selectedQR, setSelectedQR] = useState<string>('QR');
  const [selectedCard, setSelectedCard] = useState<string>('4321 8876 5432 1098');
  const [selectedWallet, setSelectedWallet] = useState<string>('Paytm');

  const handleContinueRazorpaySimulated = () => {
    const activeMethod = selectedPaymentMethod || razorpayMethod;
    if (activeMethod === 'QR') {
      if (selectedQR !== 'QR') {
        alert('Please Select Some Option');
        return;
      }
      handleConfirmRazorpayPayment('QR');
      return;
    }
    if (activeMethod === 'Card') {
      if ((!cardNumber && !selectedCard) || !cardExpiry || !cardCVV) {
        alert('Please enter card details');
        return;
      }
    }
    if (activeMethod === 'UPI') {
      if (!selectedUPIApp && !selectedUPI) {
        alert('Please Select Some Option');
        return;
      }
    }
    if (activeMethod === 'Net') {
      if (!selectedBank) {
        alert('Please Select Some Option');
        return;
      }
    }
    if (activeMethod === 'Wallet') {
      if (!selectedWalletOption && !selectedWallet) {
        alert('Please Select Some Option');
        return;
      }
    }
    handleConfirmRazorpayPayment(activeMethod as any);
  };
  
  // Real-time EventSource listener for KDS status updates
  useEffect(() => {
    if (!orderPlaced) return;
    const orderId = orderPlaced.id || orderPlaced.orderId;
    if (!orderId) return;

    if (orderId.toString().startsWith('ord-')) {
      setTrackStatus('ORDER RECEIVED');
      return;
    }

    const sseUrl = `${API_BASE}/restaurant/realtime`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'ORDER_STATUS_UPDATE' && payload.data.id === orderId) {
          const { status, estimatedPrepTime, acceptedAt } = payload.data;
          
          if (status === 'NEW' || status === 'ACCEPTED') setTrackStatus('ORDER RECEIVED');
          else if (status === 'PREPARING') setTrackStatus('COOKING');
          else if (status === 'READY') setTrackStatus('READY');
          else if (status === 'SERVED' || status === 'SERVING') setTrackStatus('SERVED');
          
          if (estimatedPrepTime) {
            const created = acceptedAt ? new Date(acceptedAt).getTime() : Date.now();
            const elapsed = Math.floor((Date.now() - created) / 60000);
            setEstTimeRemaining(Math.max(0, estimatedPrepTime - elapsed));
          }
        }
      } catch (err) {
        console.error('[SSE] Error processing message:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('[SSE] Connection error:', err);
    };

    const checkStatus = async () => {
      try {
        const response = await fetch(`${API_BASE}/restaurant/orders/${orderId}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.status) {
            if (data.status === 'NEW' || data.status === 'ACCEPTED') setTrackStatus('ORDER RECEIVED');
            else if (data.status === 'PREPARING') setTrackStatus('COOKING');
            else if (data.status === 'READY') setTrackStatus('READY');
            else if (data.status === 'SERVED' || data.status === 'SERVING') setTrackStatus('SERVED');
            
            if (data.estimatedPrepTime) {
              const created = data.acceptedAt ? new Date(data.acceptedAt).getTime() : new Date(data.createdAt).getTime();
              const elapsed = Math.floor((Date.now() - created) / 60000);
              setEstTimeRemaining(Math.max(0, data.estimatedPrepTime - elapsed));
            }
          }
        }
      } catch (err) {
        console.error('Error fetching order status:', err);
      }
    };

    checkStatus();

    const timerInterval = setInterval(() => {
      setEstTimeRemaining((prev) => {
        if (prev === null || prev <= 0) return prev;
        return prev - 1;
      });
    }, 60000);

    return () => {
      eventSource.close();
      clearInterval(timerInterval);
    };
  }, [orderPlaced]);

  const fetchMenu = async () => {
    try {
      const response = await fetch(`${API_BASE}/restaurant/public/menu/${qrToken}`);
      if (!response.ok) throw new Error('Failed to load menu');
      const data = await response.json();

      const dbCats = data.categories || [];
      const mergedCats = [...dbCats];

      defaultCats.forEach(mockCat => {
        const exists = dbCats.some((c: any) => c.name.toLowerCase().trim() === mockCat.name.toLowerCase().trim());
        if (!exists) {
          mergedCats.push({ ...mockCat, menuItems: [] });
        }
      });

      mergedCats.forEach((cat: any) => {
        if (!cat.menuItems) cat.menuItems = [];
        const mockCatId = defaultCats.find(c => c.name.toLowerCase().trim() === cat.name.toLowerCase().trim())?.id;
        if (mockCatId) {
          const mockItemsForCat = defaultItems.filter(item => item.categoryId === mockCatId);
          mockItemsForCat.forEach(mockItem => {
            const itemExists = cat.menuItems.some((i: any) => i.name.toLowerCase().trim() === mockItem.name.toLowerCase().trim());
            if (!itemExists) {
              cat.menuItems.push(mockItem);
            }
          });
        }
      });

      setMenu({
        ...data,
        categories: mergedCats
      });
    } catch (err) {
      console.warn('Utilizing public menu mock fallback.');

      const fallbackCats = defaultCats.map(cat => {
        return {
          ...cat,
          menuItems: defaultItems.filter(item => item.categoryId === cat.id)
        };
      });

      setMenu({
        table: { id: 'mock-t-1', tableNumber: 'Table 5', restaurantId: 'mock-rest' },
        restaurant: { name: 'Gourmet Bistro' },
        categories: fallbackCats
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, [qrToken]);

  useEffect(() => {
    if (!selectedCategory || !menu?.categories) return;
    const activeCat = menu.categories.find((c: any) => c.id === selectedCategory);
    const activeCatName = activeCat ? activeCat.name.toLowerCase().trim() : '';
    if (activeCatName === 'pizza' || activeCatName === 'burgers') {
      setFoodFilter('Veg');
    } else if (activeCatName === 'sea food') {
      setFoodFilter('Sea Food');
    }
  }, [selectedCategory, menu?.categories]);

  // Load Customizer configuration from shared localStorage or URL search params once menu is fetched
  useEffect(() => {
    const loadConfig = () => {
      const params = new URLSearchParams(window.location.search);
      const qTheme = params.get('theme');
      const qLogo = params.get('logo');
      const qCover = params.get('cover');
      const qWelcome = params.get('welcome');
      const qSpice = params.get('spice');
      const qRestId = params.get('restId');

      if (qTheme) setThemeColor(qTheme);
      if (qLogo && !qLogo.startsWith('data:')) setLogoUrl(qLogo);
      if (qCover && !qCover.startsWith('data:')) setCoverUrl(qCover);
      if (qWelcome) setWelcomeMsg(qWelcome);
      if (qSpice) setEnableSpiceLevels(qSpice === 'true');

      const restId = qRestId || menu?.restaurant?.id || menu?.table?.restaurantId;
      if (restId) {
        const savedConfig = localStorage.getItem(`restaurant_menu_config_${restId}`);
        if (savedConfig) {
          try {
            const parsed = JSON.parse(savedConfig);
            if (parsed.logoUrl) setLogoUrl(parsed.logoUrl);
            if (parsed.coverUrl) setCoverUrl(parsed.coverUrl);
            if (parsed.themeColor && !qTheme) setThemeColor(parsed.themeColor);
            if (parsed.welcomeMsg && !qWelcome) setWelcomeMsg(parsed.welcomeMsg);
            if (parsed.enableSpiceLevels !== undefined && !qSpice) setEnableSpiceLevels(parsed.enableSpiceLevels);
          } catch (e) {
            console.error(e);
          }
        }
      }
    };

    loadConfig();

    // Listen for instant postMessage updates from parent Customizer window
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'MENU_CONFIG_UPDATE') {
        const parsed = event.data.config;
        if (parsed.logoUrl) setLogoUrl(parsed.logoUrl);
        if (parsed.coverUrl) setCoverUrl(parsed.coverUrl);
        if (parsed.themeColor) setThemeColor(parsed.themeColor);
        if (parsed.welcomeMsg) setWelcomeMsg(parsed.welcomeMsg);
        if (parsed.enableSpiceLevels !== undefined) setEnableSpiceLevels(parsed.enableSpiceLevels);
      }
      if (event.data && event.data.type === 'MENU_ITEMS_UPDATE') {
        const { categories: newCats, menuItems: newItems } = event.data;
        setMenu((prev: any) => {
          if (!prev) return prev;
          const mappedCats = newCats.map((cat: any) => ({
            ...cat,
            menuItems: newItems.filter((item: any) => item.categoryId === cat.id)
          }));
          return {
            ...prev,
            categories: mappedCats
          };
        });
      }
    };

    // Listen for storage events as fallback
    const handleStorage = (e: StorageEvent) => {
      const restId = new URLSearchParams(window.location.search).get('restId') || menu?.restaurant?.id || menu?.table?.restaurantId;
      if (restId && e.key === `restaurant_menu_config_${restId}`) {
        try {
          const parsed = JSON.parse(e.newValue || '{}');
          if (parsed.logoUrl) setLogoUrl(parsed.logoUrl);
          if (parsed.coverUrl) setCoverUrl(parsed.coverUrl);
          if (parsed.themeColor) setThemeColor(parsed.themeColor);
          if (parsed.welcomeMsg) setWelcomeMsg(parsed.welcomeMsg);
          if (parsed.enableSpiceLevels !== undefined) setEnableSpiceLevels(parsed.enableSpiceLevels);
        } catch (err) {
          console.error(err);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [menu, window.location.search]);

  // Parser helper for food type and descriptions
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





  const getItemAddons = (item: any) => {
    if (item?.addons && item.addons.length > 0) {
      return item.addons;
    }
    // Fallback Mock Add-ons based on item type/name
    const nameLower = (item?.name || '').toLowerCase();
    if (nameLower.includes('pizza')) {
      return [
        { id: 'ao-pizza-cheese', name: 'Extra Cheese', price: 25, category: 'Cheese', maxQty: 1, isOptional: true },
        { id: 'ao-pizza-pep', name: 'Extra Pepperoni', price: 45, category: 'Toppings', maxQty: 1, isOptional: true },
        { id: 'ao-pizza-crust', name: 'Stuffed Crust', price: 60, category: 'Crust', maxQty: 1, isOptional: true }
      ];
    }
    if (nameLower.includes('burger')) {
      return [
        { id: 'ao-burger-cheese', name: 'Extra Cheese', price: 15, category: 'Cheese', maxQty: 1, isOptional: true },
        { id: 'ao-burger-patty', name: 'Extra Patty', price: 45, category: 'Patty', maxQty: 1, isOptional: true },
        { id: 'ao-burger-dip', name: 'Cheesy Dip', price: 15, category: 'Sides', maxQty: 2, isOptional: true }
      ];
    }
    if (nameLower.includes('chicken') || nameLower.includes('mutton') || nameLower.includes('non-veg') || nameLower.includes('egg') || nameLower.includes('handi')) {
      return [
        { id: 'ao-nv-egg', name: 'Boiled Egg', price: 15, category: 'Extras', maxQty: 2, isOptional: true },
        { id: 'ao-nv-gravy', name: 'Extra Gravy', price: 40, category: 'Sides', maxQty: 1, isOptional: true },
        { id: 'ao-nv-sol', name: 'Extra Solkadhi', price: 30, category: 'Drinks', maxQty: 2, isOptional: true }
      ];
    }
    if (nameLower.includes('dal') || nameLower.includes('paneer') || nameLower.includes('veg') || nameLower.includes('rice') || nameLower.includes('tadka')) {
      return [
        { id: 'ao-v-roti', name: 'Butter Roti', price: 15, category: 'Bread', maxQty: 4, isOptional: true },
        { id: 'ao-v-papad', name: 'Roasted Papad', price: 10, category: 'Sides', maxQty: 2, isOptional: true },
        { id: 'ao-v-raita', name: 'Extra Raita', price: 20, category: 'Sides', maxQty: 1, isOptional: true }
      ];
    }
    if (nameLower.includes('fish') || nameLower.includes('prawn') || nameLower.includes('sea') || nameLower.includes('crab') || nameLower.includes('lobster') || nameLower.includes('surmai')) {
      return [
        { id: 'ao-sf-sol', name: 'Extra Solkadhi', price: 30, category: 'Drinks', maxQty: 2, isOptional: true },
        { id: 'ao-sf-curry', name: 'Extra Curry Cup', price: 50, category: 'Sides', maxQty: 1, isOptional: true }
      ];
    }
    return [
      { id: 'ao-gen-extra', name: 'Extra Portion', price: 30, category: 'Extras', maxQty: 1, isOptional: true },
      { id: 'ao-gen-dip', name: 'Special Dip', price: 15, category: 'Sides', maxQty: 1, isOptional: true }
    ];
  };

  const getThemeStyles = () => {
    // Return high contrast black text and modern Poppins/Inter font style
    switch (themeColor) {
      case 'amber':
        return { bodyBg: 'bg-[#fafafa]', cardBg: 'bg-[#ffffff]', border: 'border-[#e2e8f0]', accent: 'bg-amber-500 hover:bg-amber-600', accentText: 'text-amber-600', text: 'text-black', mutedText: 'text-neutral-800', priceText: 'text-black', fontClass: "font-['Poppins',sans-serif]" };
      case 'rose':
        return { bodyBg: 'bg-[#fafafa]', cardBg: 'bg-[#ffffff]', border: 'border-[#e2e8f0]', accent: 'bg-rose-500 hover:bg-rose-600', accentText: 'text-rose-600', text: 'text-black', mutedText: 'text-neutral-800', priceText: 'text-black', fontClass: "font-['Poppins',sans-serif]" };
      case 'indigo':
        return { bodyBg: 'bg-[#fafafa]', cardBg: 'bg-[#ffffff]', border: 'border-[#e2e8f0]', accent: 'bg-indigo-600 hover:bg-indigo-700', accentText: 'text-indigo-600', text: 'text-black', mutedText: 'text-neutral-800', priceText: 'text-black', fontClass: "font-['Poppins',sans-serif]" };
      case 'violet':
        return { bodyBg: 'bg-[#fafafa]', cardBg: 'bg-[#ffffff]', border: 'border-[#e2e8f0]', accent: 'bg-violet-600 hover:bg-violet-700', accentText: 'text-violet-600', text: 'text-black', mutedText: 'text-neutral-800', priceText: 'text-black', fontClass: "font-['Poppins',sans-serif]" };
      default:
        return { bodyBg: 'bg-[#fafafa]', cardBg: 'bg-[#ffffff]', border: 'border-[#e2e8f0]', accent: 'bg-emerald-600 hover:bg-emerald-700', accentText: 'text-emerald-600', text: 'text-black', mutedText: 'text-neutral-800', priceText: 'text-black', fontClass: "font-['Poppins',sans-serif]" };
    }
  };

  const getFoodImage = (item: any) => {
    if (item.image && !item.image.includes('unsplash.com/photo-1504674900247-0877df9cc836')) {
      return item.image;
    }
    const name = item.name?.toLowerCase() || '';
    if (name.includes('pizza')) return 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('burger')) return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('paneer')) return 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('garlic bread')) return 'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('soup') || name.includes('tomato')) return 'https://images.unsplash.com/photo-1547592165-e1d17f1a0655?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('fish') || name.includes('prawn') || name.includes('sea') || name.includes('seafood')) return 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&h=300&q=80';
    if (name.includes('biryani') || name.includes('chicken') || name.includes('mutton') || name.includes('curry')) return 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&h=300&q=80';
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

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'Veg':
        return (
          <span className="inline-flex items-center justify-center w-[11px] h-[11px] border border-emerald-600 rounded-sm shrink-0 bg-white p-[1.5px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          </span>
        );
      case 'Non-Veg':
      case 'Sea Food':
        return (
          <span className="inline-flex items-center justify-center w-[11px] h-[11px] border border-red-600 rounded-sm shrink-0 bg-white p-[1.5px]">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
          </span>
        );
      default:
        return null;
    }
  };

  const style = getThemeStyles();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const getCartTotal = () => {
    return cart.reduce((sum, entry) => {
      const basePrice = entry.item.isOnOffer && entry.item.offerPrice ? entry.item.offerPrice : entry.item.price;
      const addonsPrice = entry.selectedAddOns.reduce((s, ao) => s + ao.price, 0);
      return sum + (basePrice + addonsPrice) * entry.quantity;
    }, 0);
  };

  const handleAddToCart = () => {
    if (!selectedItem) return;
    setCart(prev => {
      const idx = prev.findIndex(entry => entry.item.id === selectedItem.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx].quantity += detailQty;
        next[idx].notes = detailNotes;
        next[idx].selectedAddOns = selectedAddOns;
        next[idx].spiceLevel = spiceLevel;
        return next;
      }
      return [...prev, { item: selectedItem, quantity: detailQty, notes: detailNotes, selectedAddOns, spiceLevel }];
    });
    setAddedToCartState(true);
    setCartNotification('✓ Item added to cart successfully!');
    setTimeout(() => setCartNotification(null), 3000);
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => prev.filter(entry => entry.item.id !== id));
  };

  const getUpsellItems = () => {
    const hasBurger = cart.some(entry => entry.item.name.toLowerCase().includes('burger'));
    const hasPizza = cart.some(entry => entry.item.name.toLowerCase().includes('pizza'));
    const hasFish = cart.some(entry => entry.item.name.toLowerCase().includes('fish') || entry.item.name.toLowerCase().includes('prawn') || entry.item.name.toLowerCase().includes('sea') || entry.item.name.toLowerCase().includes('pomfret') || entry.item.name.toLowerCase().includes('surmai'));

    let upsellIds: string[] = [];
    if (hasBurger) {
      upsellIds = ['st-2', 'bv-3', 'st-8'];
    } else if (hasPizza) {
      upsellIds = ['br-5', 'bv-3', 'ds-1'];
    } else if (hasFish) {
      upsellIds = ['bv-5', 'rc-2', 'ds-6'];
    } else {
      upsellIds = ['bv-3', 'st-8', 'ds-2'];
    }

    return defaultItems.filter(item => upsellIds.includes(item.id) && !cart.some(entry => entry.item.id === item.id)).slice(0, 3);
  };

  const handleAddUpsell = (item: any) => {
    setCart(prev => {
      const idx = prev.findIndex(entry => entry.item.id === item.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx].quantity += 1;
        return next;
      }
      return [...prev, { item, quantity: 1, notes: '', selectedAddOns: [], spiceLevel: 'Medium' }];
    });
    setCartNotification(`✓ Added ${item.name} to cart!`);
    setTimeout(() => setCartNotification(null), 2000);
  };

  const handleConfirmRazorpayPayment = async (methodOverride?: 'UPI' | 'Card' | 'Net' | 'Wallet' | 'QR') => {
    const activeMethod = methodOverride || razorpayMethod;
    setPaymentProcessing(true);
    const subtotal = getCartTotal();
    const discount = subtotal * 0.10;
    const gst = (subtotal - discount) * 0.18;
    const grandTotal = subtotal + gst - discount;

    const itemsPayload = cart.map(entry => ({
      menuItemId: entry.item.id,
      quantity: entry.quantity,
      notes: entry.notes ? `${entry.notes}${enableSpiceLevels ? ` | Spice: ${entry.spiceLevel || 'Medium'}` : ''}${entry.selectedAddOns.length ? ` | Addons: ${entry.selectedAddOns.map(ao => ao.name).join(', ')}` : ''}` : `${enableSpiceLevels ? `Spice: ${entry.spiceLevel || 'Medium'}` : ''}${entry.selectedAddOns.length ? ` | Addons: ${entry.selectedAddOns.map(ao => ao.name).join(', ')}` : ''}`,
      unitPrice: entry.item.isOnOffer && entry.item.offerPrice ? entry.item.offerPrice : entry.item.price
    }));

    try {
      const res = await fetch(`${API_BASE}/restaurant/public/payment/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: grandTotal })
      });
      if (!res.ok) throw new Error('Order creation failed on payment endpoint');
      const orderData = await res.json();

      if (!(window as any).Razorpay) {
        throw new Error('Razorpay SDK not loaded');
      }

      const options = {
        key: orderData.key,
        amount: orderData.amount,
        currency: orderData.currency,
        name: menu?.restaurant?.name || 'Gourmet Bistro',
        description: `Table Order: ${menu?.table?.tableNumber || 'Table'}`,
        order_id: orderData.id,
        handler: async function (response: any) {
          setPaymentProcessing(true);
          const body = {
            tableId: menu?.table?.id || 'mock-t-1',
            items: itemsPayload,
            notes: `Cust: ${customerName} | Phone: ${customerMobile}${customerEmail ? ` | Email: ${customerEmail}` : ''} | Method: RAZORPAY-${activeMethod}`,
            paymentMethod: 'RAZORPAY',
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature
          };

          try {
            const orderRes = await fetch(`${API_BASE}/restaurant/public/order`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
            });
            if (!orderRes.ok) throw new Error('Order placement failed');
            const data = await orderRes.json();
            setOrderPlaced(data);
            setScreen('confirmation');
          } catch (err) {
            const mockId = `ord-${Date.now().toString().slice(-6)}`;
            setOrderPlaced({
              id: mockId,
              orderId: mockId,
              totalAmount: grandTotal,
              paymentStatus: 'PAID'
            });
            setScreen('confirmation');
          } finally {
            setPaymentProcessing(false);
          }
        },
        prefill: {
          contact: customerMobile || undefined,
          name: customerName || undefined,
          email: customerEmail || undefined
        },
        theme: {
          color: '#059669',
        },
        modal: {
          ondismiss: function () {
            setPaymentProcessing(false);
            setScreen('payment_failed');
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (resp: any) {
        console.error('Razorpay payment failed:', resp.error);
        setScreen('payment_failed');
      });
      rzp.open();

    } catch (err) {
      console.warn('Real Razorpay initialization failed, executing simulated success flow:', err);
      // Fallback to simulated payment success
      setTimeout(async () => {
        const body = {
          tableId: menu?.table?.id || 'mock-t-1',
          items: itemsPayload,
          notes: `Cust: ${customerName} | Phone: ${customerMobile}${customerEmail ? ` | Email: ${customerEmail}` : ''} | Method: RAZORPAY-${activeMethod} (Simulated)`,
          paymentMethod: 'RAZORPAY',
          razorpayPaymentId: `pay_${Math.random().toString(36).substring(2, 11)}`,
          razorpayOrderId: `order_${Math.random().toString(36).substring(2, 11)}`
        };

        try {
          const response = await fetch(`${API_BASE}/restaurant/public/order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
          });
          const data = await response.json();
          setOrderPlaced(data);
          setScreen('confirmation');
        } catch (e) {
          const mockId = `ord-${Date.now().toString().slice(-6)}`;
          setOrderPlaced({
            id: mockId,
            orderId: mockId,
            totalAmount: grandTotal,
            paymentStatus: 'PAID'
          });
          setScreen('confirmation');
        } finally {
          setPaymentProcessing(false);
        }
      }, 1500);
    }
  };

  const handleCheckout = async () => {
    setScreen('razorpay');
  };

  const handleResetAll = () => {
    setCart([]);
    setScreen('menu');
    setFoodFilter('Veg');
    setSelectedItem(null);
    setCustomerName('');
    setCustomerMobile('');
    setCustomerEmail('');
    setSearchQuery('');
    setOrderPlaced(null);
    setTrackStatus('ORDER RECEIVED');
    setRazorpayMethod('QR');
    setSelectedPaymentMethod('QR');
    setSelectedUPI('GPay');
    setSelectedQR('QR');
    setSelectedCard('4321 8876 5432 1098');
    setSelectedWallet('Paytm');
  };

  const getPdfUrl = () => {
    if (orderPlaced?.invoice?.pdfUrl) {
      const baseUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : `${window.location.protocol}//${window.location.hostname}:5000`;
      return `${baseUrl}${orderPlaced.invoice.pdfUrl}`;
    }
    return null;
  };

  const handleViewInvoice = () => {
    const url = getPdfUrl();
    if (url) {
      window.open(url, '_blank');
    } else {
      alert('Invoice PDF not available');
    }
  };

  const handleDownloadInvoice = () => {
    const url = getPdfUrl();
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', orderPlaced?.invoice?.invoiceNumber ? `${orderPlaced.invoice.invoiceNumber}.pdf` : 'invoice.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('Invoice PDF not available');
    }
  };

  const handlePrintInvoice = () => {
    const url = getPdfUrl();
    if (url) {
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.focus();
        printWindow.print();
      }
    } else {
      alert('Invoice PDF not available');
    }
  };

  const handleWhatsAppInvoice = async () => {
    const invoiceId = orderPlaced?.invoice?.id;
    if (!invoiceId) {
      alert('Invoice details not found to send WhatsApp notification');
      return;
    }
    const phone = customerMobile || prompt('Please enter mobile number to send WhatsApp invoice:');
    if (!phone) return;

    try {
      const response = await fetch(`${API_BASE}/invoice/send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, phone })
      });
      const data = await response.json();
      if (response.ok) {
        alert(data.message || 'WhatsApp invoice sent successfully');
      } else {
        alert(data.message || 'Failed to send WhatsApp invoice');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error sending WhatsApp invoice');
    }
  };



  const getFilteredItems = (catId: string) => {
    const category = menu?.categories?.find((c: any) => c.id === catId);
    if (!category || !category.menuItems) return [];

    return category.menuItems.filter((item: any) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      const catName = category.name.toLowerCase().trim();
      if (catName === 'desserts' || catName === 'beverages' || catName === 'breads') {
        return true;
      }

      if (foodFilter === 'All') return true;
      const { type } = parseFoodTypeAndDescription(item);
      return type === foodFilter;
    });
  };

  const categories = menu?.categories || [];
  const cartCount = cart.reduce((sum, entry) => sum + entry.quantity, 0);

  return (
    <div className={`h-screen overflow-hidden ${style.bodyBg} ${style.text} ${style.fontClass} flex flex-col justify-between max-w-md mx-auto shadow-2xl relative select-none bg-white`}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800;900&display=swap');
        .scrollbar-none::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        .scrollbar-none {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}} />


      {screen === 'menu' && (
        <div className="flex-1 flex flex-col justify-between h-full max-h-full overflow-hidden relative">
          <div className="overflow-y-auto pb-28 scrollbar-none flex-1">
            {/* Shop Banner Image Header */}
            <div className="relative shrink-0 h-40 w-full overflow-hidden bg-black text-white" data-welcome={welcomeMsg}>
              <img src={coverUrl} alt="Cover Banner" className="w-full h-full object-cover opacity-60 absolute inset-0" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4 flex items-center gap-4 text-left">
                <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-full object-cover border-2 border-white shrink-0 bg-white" />
                <div className="leading-tight">
                  <h4 className="font-extrabold text-lg text-white tracking-tight truncate w-64 mb-1">{menu?.restaurant?.name || 'Gourmet Bistro'}</h4>
                  <span className="text-[10px] text-neutral-300 font-extrabold uppercase tracking-widest block leading-none">{menu?.table?.tableNumber || 'Table'} Dine-in Menu</span>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="px-4 py-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search food, drinks, desserts..."
                className="w-full bg-neutral-100 border border-neutral-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black focus:bg-white text-black placeholder-neutral-500 font-medium"
              />
            </div>

            {/* Category Cards (Instead of tabs with photos) */}
            <div className="flex gap-2.5 overflow-x-auto px-4 py-2.5 select-none shrink-0 scrollbar-none bg-white sticky top-0 z-10 border-b border-neutral-100">
              {categories.map((cat: any) => {
                const itemsCount = getFilteredItems(cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`py-2 px-4 rounded-xl text-[11px] font-extrabold transition-all border whitespace-nowrap flex flex-col items-start min-w-[100px] gap-0.5 ${selectedCategory === cat.id
                        ? `${style.accent} border-transparent text-white shadow-sm`
                        : `bg-neutral-50 border-neutral-200 text-black`
                      }`}
                  >
                    <span className="uppercase tracking-wider font-extrabold text-[11px]">{cat.name}</span>
                    <span className={`text-[9px] font-bold ${selectedCategory === cat.id ? 'text-neutral-200' : 'text-neutral-500'}`}>{itemsCount} Items</span>
                  </button>
                );
              })}
            </div>

            {/* Filter Tabs depending on supported filters of active category */}
            {(() => {
              const activeCat = categories.find((c: any) => c.id === selectedCategory);
              const activeCatName = activeCat ? activeCat.name.toLowerCase().trim() : '';
              let supportedFilters: ('Veg' | 'Non-Veg' | 'Sea Food')[] = ['Veg', 'Non-Veg', 'Sea Food'];
              if (activeCatName === 'pizza' || activeCatName === 'burgers') {
                supportedFilters = ['Veg', 'Non-Veg'];
              } else if (activeCatName === 'sea food') {
                supportedFilters = ['Sea Food'];
              } else if (activeCatName === 'desserts' || activeCatName === 'beverages' || activeCatName === 'breads') {
                supportedFilters = [];
              }

              if (supportedFilters.length <= 1) return null;

              return (
                <div className="flex gap-2 overflow-x-auto px-4 py-3 select-none justify-center shrink-0 scrollbar-none border-b border-neutral-50">
                  {supportedFilters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setFoodFilter(filter)}
                      className={`py-1.5 px-4 rounded-lg text-[10px] font-extrabold transition-all border whitespace-nowrap ${foodFilter === filter
                        ? `${style.accent} border-transparent text-white shadow-sm`
                        : `bg-white border-neutral-200 text-black hover:bg-neutral-50`
                        }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              );
            })()}

            {/* Catalog Items */}
            <div className="p-4 space-y-6">
              {categories
                .filter((cat: any) => !selectedCategory || cat.id === selectedCategory)
                .map((category: any) => {
                  const items = getFilteredItems(category.id);
                  if (items.length === 0) return null;
                  return (
                    <div key={category.id} id={`public-cat-${category.id}`} className="space-y-4 pt-2 border-t border-neutral-100">
                      <div className="text-left flex flex-col mb-3">
                        <h5 className="text-sm uppercase tracking-wider font-black text-black">{category.name}</h5>
                        <span className="text-[11px] text-neutral-500 font-semibold block">{category.description}</span>
                      </div>
                      <div className="space-y-4">
                        {items.map((item: any) => {
                          const { type, cleanDesc } = parseFoodTypeAndDescription(item);
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                setSelectedItem(item);
                                setDetailQty(1);
                                setDetailNotes('');
                                setSpiceLevel('Medium');
                                setSelectedAddOns([]);
                                setAddedToCartState(false);
                                setScreen('details');
                              }}
                              className="group cursor-pointer select-none text-left py-1"
                            >
                              <div className="flex justify-between items-start gap-3">
                                <div className="flex items-center gap-2 max-w-[70%]">
                                  <div className="shrink-0 flex items-center h-full">{getTypeBadge(type)}</div>
                                  <span className="font-extrabold text-[14px] text-black tracking-tight break-words whitespace-normal leading-normal">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {item.isOnOffer && item.offerPrice ? (
                                    <div className="text-right">
                                      <span className="text-[11px] text-neutral-400 line-through block leading-none">₹{item.price}</span>
                                      <span className="font-black text-[14px] text-black block mt-0.5 leading-none">₹{item.offerPrice}</span>
                                      <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[8px] font-black px-1 rounded-sm uppercase inline-block mt-1">OFFER</span>
                                    </div>
                                  ) : (
                                    <span className="font-black text-[14px] text-black">₹{item.price}</span>
                                  )}
                                </div>
                              </div>
                              <p className="text-[11.5px] text-neutral-800 font-medium mt-1 pr-6 break-words whitespace-normal leading-relaxed">{cleanDesc}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {cartCount > 0 && (
            <div className="absolute bottom-4 right-4 z-30">
              <button
                onClick={() => setScreen('cart')}
                className={`flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl text-white ${style.accent} hover:scale-105 active:scale-95 transition-all`}
              >
                <div className="relative mr-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><line x1="3" x2="21" y1="6" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
                  <span className="absolute -top-2.5 -right-2.5 bg-red-600 border border-white text-white text-[9.5px] font-medium w-[19px] h-[19px] rounded-full flex items-center justify-center shadow-md leading-none">
                    {cartCount}
                  </span>
                </div>
                <span className="text-xs font-black uppercase tracking-wider pr-1">₹{getCartTotal().toFixed(2)}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {screen === 'details' && selectedItem && (() => {
        const { type, cleanDesc } = parseFoodTypeAndDescription(selectedItem);
        const displayPrice = selectedItem.isOnOffer && selectedItem.offerPrice ? selectedItem.offerPrice : selectedItem.price;
        return (
          <div className="flex-1 flex flex-col justify-between p-4 bg-white text-left h-full max-h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pb-24 scrollbar-none">
              <button onClick={() => setScreen('menu')} className={`text-[9px] font-extrabold ${style.accentText} uppercase tracking-wider flex items-center gap-1`}>
                ← Back to Menu
              </button>

              <div className="w-full h-48 rounded-2xl overflow-hidden border border-neutral-100 bg-neutral-50 shrink-0 shadow-sm mt-2">
                <img src={getFoodImage(selectedItem)} alt={selectedItem.name} className="w-full h-full object-cover" />
              </div>

              <div className="flex justify-between items-start pt-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    {getTypeBadge(type)}
                    <h4 className="font-extrabold text-base text-black">{selectedItem.name}</h4>
                  </div>
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-amber-600">
                    <span>★ 4.8</span>
                    <span className="text-neutral-500">• 200+ Reviews</span>
                    <span className="text-neutral-500">• Prep: 15 mins</span>
                  </div>
                  <p className="text-sm text-black font-medium leading-relaxed">{cleanDesc || 'Prepared fresh with premium handpicked ingredients.'}</p>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  {selectedItem.isOnOffer && selectedItem.offerPrice ? (
                    <>
                      <span className="text-xs text-neutral-500 line-through">₹{selectedItem.price}</span>
                      <span className="text-lg font-black text-black">₹{selectedItem.offerPrice}</span>
                      <span className="bg-rose-100 text-rose-800 border border-rose-200 text-[9px] font-black px-1.5 py-0.5 rounded uppercase mt-1">Special Offer</span>
                    </>
                  ) : (
                    <span className="text-lg font-black text-black">₹{selectedItem.price}</span>
                  )}
                </div>
              </div>

              {enableSpiceLevels && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-black">Select Spice Level</span>
                  <div className="flex gap-2">
                    {(['Mild', 'Medium', 'Hot'] as const).map(level => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSpiceLevel(level)}
                        className={`py-1.5 px-4 rounded-lg text-xs font-bold border transition-all ${spiceLevel === level
                          ? 'bg-black text-white border-transparent'
                          : 'bg-white border-neutral-200 text-neutral-800'
                          }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-800">Choose Add-ons</span>
                <div className="space-y-2">
                  {getItemAddons(selectedItem).map((addon: any, index: number) => {
                    const isSel = selectedAddOns.some(ao => ao.name === addon.name);
                    return (
                      <label key={addon.id || `ao-${index}`} className="flex justify-between items-center bg-neutral-50 p-3 rounded-xl border border-neutral-200 cursor-pointer select-none">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedAddOns(prev => [...prev, addon]);
                              } else {
                                setSelectedAddOns(prev => prev.filter(ao => ao.name !== addon.name));
                              }
                            }}
                            className="rounded text-black focus:ring-black w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-neutral-900">{addon.name}</span>
                        </div>
                        <span className="text-xs font-extrabold text-neutral-700">+₹{addon.price}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-neutral-800">Special Instructions</label>
                <input
                  type="text"
                  value={detailNotes}
                  onChange={(e) => setDetailNotes(e.target.value)}
                  placeholder="E.g. No onion, less spicy, make it hot"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-black text-black placeholder-neutral-400"
                />
              </div>
            </div>

            {addedToCartState ? (
              <div className="pt-4 border-t flex flex-col gap-3 bg-white w-full animate-fade-in">
                <div className="flex items-center justify-center gap-2 text-emerald-600 font-extrabold text-sm py-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span>✓ Added to Cart</span>
                </div>
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => {
                      setAddedToCartState(false);
                      setScreen('menu');
                    }}
                    className="flex-1 bg-neutral-100 hover:bg-neutral-200 text-black font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider text-center border border-neutral-200"
                  >
                    Continue Shopping
                  </button>
                  <button
                    onClick={() => {
                      setAddedToCartState(false);
                      setScreen('cart');
                    }}
                    className={`flex-1 ${style.accent} text-white font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider text-center`}
                  >
                    View Cart
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-2.5 border-t flex items-center justify-between gap-3 bg-white">
                <div className="flex items-center border border-slate-200 bg-slate-50 rounded-lg overflow-hidden shrink-0">
                  <button onClick={() => setDetailQty(q => Math.max(1, q - 1))} className="px-2 py-1.5 text-xs font-bold">-</button>
                  <span className="px-3 text-xs font-bold">{detailQty}</span>
                  <button onClick={() => setDetailQty(q => q + 1)} className="px-2 py-1.5 text-xs font-bold">+</button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className={`flex-grow ${style.accent} text-white font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider text-center`}
                >
                  Add to Cart • ₹{((displayPrice + selectedAddOns.reduce((s, a) => s + a.price, 0)) * detailQty).toFixed(2)}
                </button>
              </div>
            )}
          </div>
        );
      })()}



      {screen === 'cart' && (() => {
        const subtotal = getCartTotal();
        const discount = subtotal * 0.10;
        const gst = (subtotal - discount) * 0.18;
        const grandTotal = subtotal + gst - discount;
        return (
          <div className="flex-1 flex flex-col justify-between p-4 bg-white text-left h-full max-h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pb-24 scrollbar-none">
              <button onClick={() => setScreen('menu')} className="text-xs font-bold text-black uppercase tracking-wider flex items-center gap-1">
                ← Add More Items
              </button>
              <h4 className="font-extrabold text-base text-black">Your Dining Basket</h4>

              {cart.length === 0 ? (
                <p className="text-xs text-neutral-400 py-6 text-center italic">Your cart is empty.</p>
              ) : (
                <div className="space-y-4">
                  {cart.map((entry, index) => {
                    const displayPrice = entry.item.isOnOffer && entry.item.offerPrice ? entry.item.offerPrice : entry.item.price;
                    const addonsSum = entry.selectedAddOns.reduce((s, a) => s + a.price, 0);
                    const entryTotal = (displayPrice + addonsSum) * entry.quantity;

                    return (
                      <div key={index} className="flex justify-between items-center pb-3 border-b border-dashed border-neutral-200 gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="text-left">
                            <h5 className="font-bold text-xs text-black">{entry.item.name} <span className="opacity-60 font-medium">x {entry.quantity}</span></h5>
                            {enableSpiceLevels && entry.spiceLevel && <span className="text-[10px] text-neutral-500 font-bold block">Spice: {entry.spiceLevel}</span>}
                            {entry.selectedAddOns.length > 0 && (
                              <div className="text-[10px] text-neutral-500 font-medium">
                                Add-ons: {entry.selectedAddOns.map(ao => `${ao.name} (+₹${ao.price})`).join(', ')}
                              </div>
                            )}
                            {entry.notes && <p className="text-[10px] text-amber-600 font-semibold mt-1">Note: "{entry.notes}"</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-black text-xs text-black">₹{entryTotal.toFixed(2)}</span>
                          <button onClick={() => handleRemoveFromCart(entry.item.id)} className="text-red-600 hover:text-red-800 text-[10px] font-extrabold uppercase">Remove</button>
                        </div>
                      </div>
                    );
                  })}
                  {/* Customers Also Add Section */}
                  {getUpsellItems().length > 0 && (
                    <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 mt-4 space-y-3">
                      <h5 className="text-[11px] font-black text-black uppercase tracking-wider">Customers Also Add</h5>
                      <div className="grid grid-cols-1 gap-2.5">
                        {getUpsellItems().map(item => {
                          const { type } = parseFoodTypeAndDescription(item);
                          return (
                            <div key={item.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-neutral-100 shadow-sm">
                              <div className="flex items-center gap-2 truncate">
                                {getTypeBadge(type)}
                                <div className="text-left leading-tight truncate">
                                  <span className="font-extrabold text-[12px] text-black block truncate">{item.name}</span>
                                  <span className="font-black text-[11px] text-neutral-600 block mt-0.5">₹{item.price}</span>
                                </div>
                              </div>
                              <button
                                onClick={() => handleAddUpsell(item)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold text-white uppercase tracking-wider shrink-0 transition-all ${style.accent}`}
                              >
                                + Add
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pt-2 border-t space-y-3">
              {subtotal > 0 && (
                <div className="space-y-2 bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-neutral-800">
                  <div className="flex justify-between text-xs font-medium"><span>Items total:</span><span>₹{subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-xs font-medium text-emerald-600"><span>10% Dine-In discount:</span><span>-₹{discount.toFixed(2)}</span></div>
                  <div className="flex justify-between text-xs font-medium"><span>GST (18%):</span><span>₹{gst.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm font-black text-black border-t border-neutral-200 pt-2 mt-1"><span>Total Amount:</span><span>₹{grandTotal.toFixed(2)}</span></div>
                </div>
              )}
              <button
                onClick={() => handleConfirmRazorpayPayment()}
                disabled={cart.length === 0}
                className={`w-full ${style.accent} text-white font-extrabold py-3 px-4 rounded-xl text-xs uppercase tracking-wider text-center disabled:opacity-50`}
              >
                Proceed to Payment →
              </button>
            </div>
          </div>
        );
      })()}

      {screen === 'payment' && (() => {
        const subtotal = getCartTotal();
        const discount = subtotal * 0.10;
        const gst = (subtotal - discount) * 0.18;
        const grandTotal = subtotal + gst - discount;
        return (
          <div className="flex-1 flex flex-col justify-between p-4 bg-white text-left h-full max-h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pb-24 scrollbar-none">
              <button onClick={() => setScreen('cart')} className={`text-[9px] font-extrabold ${style.accentText} uppercase tracking-wider`}>
                ← Back
              </button>
              <h4 className="font-extrabold text-sm text-slate-800">Payment Method</h4>
              <div className="p-3.5 border rounded-xl bg-slate-50 border-neutral-200 mt-2">
                <span className="text-[10px] font-extrabold text-slate-800 block">Pay Online (Razorpay)</span>
                <span className="text-[8px] text-slate-400 block">UPI, Cards, Netbanking & Wallets</span>
              </div>
            </div>

            <div className="pt-2 border-t space-y-2">
              <div className="flex justify-between text-[11px] font-black text-slate-800">
                <span>Pay Total:</span>
                <span className={style.accentText}>₹{grandTotal.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                className={`w-full ${style.accent} text-white font-extrabold py-2.5 px-3 rounded-lg text-[10px] uppercase tracking-wider text-center`}
              >
                Proceed to Pay Online
              </button>
            </div>
          </div>
        );
      })()}

      {screen === 'status' && (() => {
        const steps = ['ORDER RECEIVED', 'COOKING', 'READY', 'SERVED'] as const;
        const curIdx = steps.indexOf(trackStatus);
        return (
          <div className="flex-grow flex flex-col justify-between p-4 bg-slate-950 text-slate-200 text-left h-full max-h-full overflow-hidden">
            <div className="flex-grow flex flex-col justify-center items-center text-center pt-6 space-y-4">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center shadow-lg animate-pulse mb-2">
                <Clock className="w-6 h-6 animate-spin [animation-duration:8s]" />
              </div>
              <h4 className="font-extrabold text-sm text-white">Live Kitchen Tracking</h4>
              <div className="text-[9px] bg-slate-900 border border-slate-800 rounded-xl p-3 w-full text-left space-y-1.5">
                <div className="flex justify-between text-slate-400"><span>Order ID:</span><span className="font-mono text-emerald-400 font-extrabold">{orderPlaced?.id || orderPlaced?.orderId}</span></div>
                <div className="flex justify-between text-slate-400"><span>Table Assigned:</span><span className="text-white font-extrabold">{menu?.table?.tableNumber || 'Table'}</span></div>
                <div className="flex justify-between text-slate-400"><span>Diner Name:</span><span className="text-white font-extrabold">{customerName || 'Harry'}</span></div>
                <div className="flex justify-between text-slate-400"><span>Preparation Level:</span><span className="text-white font-extrabold">{trackStatus}</span></div>
                 {estTimeRemaining !== null && estTimeRemaining > 0 && (
                  <div className="flex justify-between text-slate-400 border-t border-slate-800 pt-1.5">
                    <span>Est. Time Remaining:</span>
                    <span className="text-amber-400 font-extrabold">{estTimeRemaining} mins</span>
                  </div>
                )}
              </div>
 
              <div className="relative w-full pl-6 space-y-4 text-left pt-2">
                <div className="absolute left-[9px] top-2.5 bottom-2.5 w-0.5 bg-slate-800"></div>
                {steps.map((st, idx) => {
                  const isAct = trackStatus === st;
                  const isDone = curIdx >= idx;
                  return (
                    <div key={st} className="relative flex items-center gap-3">
                      <div className={`absolute left-[-20px] w-2.5 h-2.5 rounded-full border transition-all ${isAct ? 'bg-emerald-500 border-emerald-500 scale-110 shadow-lg shadow-emerald-500/40' : isDone ? 'bg-emerald-600 border-emerald-600' : 'bg-slate-900 border-slate-800'
                        }`} />
                      <span className={`text-[9px] font-bold ${isAct ? 'text-emerald-400' : isDone ? 'text-slate-300' : 'text-slate-600'}`}>{st}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-800 flex flex-col gap-2 w-full shrink-0">
              <button onClick={() => setScreen('invoice')} className="w-full bg-slate-900 border border-slate-800 text-slate-300 font-extrabold py-2 rounded-lg text-[9px] uppercase tracking-wider text-center">
                View Invoice Receipt
              </button>
              <button onClick={() => setScreen('menu')} className="w-full border border-slate-800 text-slate-500 font-bold py-1 rounded-lg text-[8px] uppercase tracking-wider text-center">
                Back to Menu Catalog
              </button>
            </div>
          </div>
        );
      })()}

      {screen === 'billing' && (() => {
        const subtotal = getCartTotal();
        const discount = subtotal * 0.10;
        const gst = (subtotal - discount) * 0.18;
        const grandTotal = subtotal + gst - discount;
        return (
          <div className="flex-1 flex flex-col justify-between p-4 bg-white text-left h-full max-h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pb-24 scrollbar-none">
              <h4 className="font-extrabold text-sm text-center border-b pb-2 text-slate-800">Dine-in Summary Bill</h4>

              <div className="space-y-2 text-[9px] pt-1">
                {cart.map((entry, idx) => {
                  const basePrice = entry.item.isOnOffer && entry.item.offerPrice ? entry.item.offerPrice : entry.item.price;
                  const addonsSum = entry.selectedAddOns.reduce((s, a) => s + a.price, 0);
                  const entryTotal = (basePrice + addonsSum) * entry.quantity;
                  return (
                    <div key={idx} className="flex justify-between text-slate-600">
                      <span>{entry.item.name} x {entry.quantity}</span>
                      <span>₹{entryTotal.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-dashed pt-2 space-y-1.5 text-[9px] text-slate-500">
                <div className="flex justify-between"><span>Subtotal:</span><span>₹{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-emerald-600"><span>10% Dine-In Promo:</span><span>-₹{discount.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>GST (18%):</span><span>₹{gst.toFixed(2)}</span></div>
              </div>
            </div>

            <div className="pt-2 border-t space-y-2">
              <div className="flex justify-between text-[11px] font-black text-slate-800">
                <span>Grand Total:</span>
                <span className={style.accentText}>₹{grandTotal.toFixed(2)}</span>
              </div>
              {paymentOption === 'Razorpay' ? (
                <button
                  onClick={() => setScreen('razorpay')}
                  className={`w-full ${style.accent} text-white font-extrabold py-2.5 px-3 rounded-lg text-[10px] uppercase tracking-wider text-center`}
                >
                  Pay Online (Razorpay Checkout)
                </button>
              ) : (
                <button
                  onClick={() => setScreen('invoice')}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-extrabold py-2.5 px-3 rounded-lg text-[10px] uppercase tracking-wider text-center"
                >
                  Simulate Cash Bill Settlement
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {screen === 'razorpay' && (() => {
        const subtotal = getCartTotal();
        const discount = subtotal * 0.10;
        const gst = (subtotal - discount) * 0.18;
        const grandTotal = subtotal + gst - discount;
        return (
          <div className="flex-1 flex flex-col justify-between p-4 bg-[#1c2438] text-white text-left rounded-b-2xl h-full max-h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto scrollbar-none space-y-4 pb-4">
              {paymentProcessing ? (
                <div className="space-y-3 py-10 text-center">
                  <Loader2 className="h-8 w-8 text-[#3399cc] animate-spin mx-auto" />
                  <h5 className="text-[10px] font-bold text-slate-300">Authorizing Payment...</h5>
                  <p className="text-[7.5px] text-slate-500">Processing secure transaction via Razorpay API</p>
                </div>
              ) : (
                <div className="w-full space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-700 pb-2 text-left justify-start">
                    <div className="w-5 h-5 bg-[#3399cc] rounded flex items-center justify-center font-black text-white text-[10px]">R</div>
                    <div>
                      <h5 className="text-[10px] font-bold leading-none">Razorpay Gateway</h5>
                      <span className="text-[7.5px] text-[#3399cc] font-extrabold uppercase">Secure Dine-In Gateway</span>
                    </div>
                  </div>

                  <div className="bg-[#141b29] p-3 rounded-xl text-left space-y-2">
                    <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Select Payment Mode</span>
                    <div className="grid grid-cols-2 gap-2">
                      {(['UPI', 'Card', 'Net', 'Wallet', 'QR'] as const).map(mode => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setRazorpayMethod(mode);
                            setSelectedPaymentMethod(mode);
                            if (mode === 'QR') {
                              setSelectedQR('QR');
                            }
                          }}
                          className={`py-2 px-3 rounded-lg border text-[9px] font-extrabold uppercase text-center transition-all ${razorpayMethod === mode || selectedPaymentMethod === mode
                            ? 'bg-[#3399cc]/15 border-[#3399cc] text-white'
                            : 'border-slate-800 bg-[#1c2438]/50 text-slate-400'
                            }`}
                        >
                          {mode === 'Net' ? 'Net Banking' : mode === 'QR' ? 'UPI QR Pay' : mode}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dynamic Sub-Payment Method Details / Input Forms */}
                  {(razorpayMethod === 'QR' || selectedPaymentMethod === 'QR') && (
                    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-slate-700/50 mt-2">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=gourmetbistro@paytm&pn=GourmetBistro&am=${grandTotal}`)}`} alt="UPI QR Code" className="w-28 h-28 object-contain" />
                      <span className="text-[9px] text-slate-800 font-extrabold mt-2 uppercase tracking-wide">Scan QR Code using any UPI App</span>
                    </div>
                  )}

                  {(razorpayMethod === 'UPI' || selectedPaymentMethod === 'UPI') && (
                    <div className="bg-[#141b29] p-3 rounded-xl text-left space-y-2 mt-2">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Select UPI App</span>
                      <div className="grid grid-cols-2 gap-2">
                        {(['GPay', 'PhonePe', 'Paytm', 'BHIM'] as const).map(app => (
                          <button
                            key={app}
                            type="button"
                            onClick={() => {
                              setSelectedUPIApp(app);
                              setSelectedUPI(app);
                            }}
                            className={`py-1.5 px-3 rounded-lg border text-[8.5px] font-bold text-center transition-all ${selectedUPIApp === app || selectedUPI === app
                              ? 'bg-[#3399cc]/15 border-[#3399cc] text-white'
                              : 'border-slate-800 bg-[#1c2438]/30 text-slate-400'
                              }`}
                          >
                            {app}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(razorpayMethod === 'Card' || selectedPaymentMethod === 'Card') && (
                    <div className="bg-[#141b29] p-3 rounded-xl text-left space-y-2.5 mt-2">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Enter Card Details</span>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Card Number (e.g. 4321 8876 5432 1098)"
                          value={cardNumber}
                          onChange={(e) => {
                            setCardNumber(e.target.value);
                            setSelectedCard(e.target.value);
                          }}
                          className="w-full bg-[#1c2438] border border-slate-800 rounded-lg px-2.5 py-1.5 text-[9px] text-white focus:outline-none focus:border-[#3399cc]"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            className="w-full bg-[#1c2438] border border-slate-800 rounded-lg px-2.5 py-1.5 text-[9px] text-white focus:outline-none focus:border-[#3399cc]"
                          />
                          <input
                            type="password"
                            placeholder="CVV"
                            value={cardCVV}
                            onChange={(e) => setCardCVV(e.target.value)}
                            className="w-full bg-[#1c2438] border border-slate-800 rounded-lg px-2.5 py-1.5 text-[9px] text-white focus:outline-none focus:border-[#3399cc]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {(razorpayMethod === 'Net' || selectedPaymentMethod === 'Net') && (
                    <div className="bg-[#141b29] p-3 rounded-xl text-left space-y-2 mt-2">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Select Popular Bank</span>
                      <div className="grid grid-cols-2 gap-2">
                        {(['SBI', 'HDFC', 'ICICI', 'AXIS'] as const).map(bank => (
                          <button
                            key={bank}
                            type="button"
                            onClick={() => setSelectedBank(bank)}
                            className={`py-1.5 px-3 rounded-lg border text-[8.5px] font-bold text-center transition-all ${selectedBank === bank
                              ? 'bg-[#3399cc]/15 border-[#3399cc] text-white'
                              : 'border-slate-800 bg-[#1c2438]/30 text-slate-400'
                              }`}
                          >
                            {bank}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(razorpayMethod === 'Wallet' || selectedPaymentMethod === 'Wallet') && (
                    <div className="bg-[#141b29] p-3 rounded-xl text-left space-y-2 mt-2">
                      <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Select Wallet</span>
                      <div className="grid grid-cols-2 gap-2">
                        {(['Paytm', 'PhonePe', 'AmazonPay', 'Mobikwik'] as const).map(wallet => (
                          <button
                            key={wallet}
                            type="button"
                            onClick={() => {
                              setSelectedWalletOption(wallet);
                              setSelectedWallet(wallet);
                            }}
                            className={`py-1.5 px-3 rounded-lg border text-[8.5px] font-bold text-center transition-all ${selectedWalletOption === wallet || selectedWallet === wallet
                              ? 'bg-[#3399cc]/15 border-[#3399cc] text-white'
                              : 'border-slate-800 bg-[#1c2438]/30 text-slate-400'
                              }`}
                          >
                            {wallet}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-[#141b29] p-2.5 rounded-lg flex justify-between items-center text-[10px] font-bold">
                    <span className="text-slate-400">Total Amount:</span>
                    <span className="text-emerald-400">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {!paymentProcessing && (
              <div className="pt-2 border-t border-slate-800 shrink-0">
                <button
                  onClick={handleContinueRazorpaySimulated}
                  className="w-full bg-[#3399cc] hover:bg-[#2e8ab8] text-white font-extrabold py-2.5 px-3 rounded-lg text-[10px] uppercase tracking-wider text-center"
                >
                  Continue
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {screen === 'invoice' && (() => {
        const subtotal = getCartTotal();
        const discount = subtotal * 0.10;
        const gst = (subtotal - discount) * 0.18;
        const grandTotal = subtotal + gst - discount;
        const invoiceNum = orderPlaced?.invoice?.invoiceNumber || orderPlaced?.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`;
        return (
          <div className="flex-1 flex flex-col justify-between p-4 bg-[#f8fafc] text-[#1e293b] text-left h-full max-h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-4 pb-24 scrollbar-none text-center">
              <button onClick={() => setScreen('status')} className="text-[9px] font-extrabold text-emerald-600 uppercase tracking-wider self-start mb-2 block">
                ← Back to Tracking
              </button>
              {/* Tick indicator */}
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md mb-2">
                <Check className="w-5 h-5 font-black" />
              </div>
              <h4 className="font-extrabold text-[12px] text-slate-800">{paymentOption === 'Razorpay' ? 'Order Settled Successfully!' : 'Order Placed successfully!'}</h4>
              {paymentOption === 'Razorpay' ? (
                <span className="text-[8px] text-emerald-600 font-extrabold uppercase bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">Paid Invoice</span>
              ) : (
                <span className="text-[8px] text-amber-600 font-extrabold uppercase bg-amber-50 border border-amber-100 px-2.5 py-0.5 rounded-full">Payment Pending at Counter</span>
              )}

              <div className="border-t border-b border-dashed border-slate-200 py-3 mt-3 space-y-2 text-left text-[9px]">
                <div className="flex justify-between"><span className="text-slate-400">Restaurant:</span><span className="font-bold">{menu?.restaurant?.name || 'Gourmet Bistro'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Invoice Number:</span><span className="font-mono font-bold">{invoiceNum}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Order Number:</span><span className="font-mono font-bold">{orderPlaced?.id || orderPlaced?.orderId}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Diner Name:</span><span className="font-bold">{customerName || 'Harry'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Table:</span><span className="font-bold">{menu?.table?.tableNumber || 'Table 5'}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Payment Status:</span><span className={`font-bold uppercase ${paymentOption === 'Razorpay' ? 'text-emerald-600' : 'text-amber-500'}`}>{paymentOption === 'Razorpay' ? 'PAID' : 'PENDING'}</span></div>

                <div className="pt-2 border-t">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">Receipt Summary</span>
                  {cart.map((entry, idx) => {
                    const basePrice = entry.item.isOnOffer && entry.item.offerPrice ? entry.item.offerPrice : entry.item.price;
                    const addonsSum = entry.selectedAddOns.reduce((s, a) => s + a.price, 0);
                    const entryTotal = (basePrice + addonsSum) * entry.quantity;
                    return (
                      <div key={idx} className="flex justify-between text-[8px] text-slate-600">
                        <span>{entry.item.name} x {entry.quantity}</span>
                        <span>₹{entryTotal.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-left text-[9px] space-y-1 pt-1 text-slate-500">
                <div className="flex justify-between"><span>Subtotal:</span><span>₹{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Dine-in Discount (10%):</span><span>-₹{discount.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>GST (18%):</span><span>₹{gst.toFixed(2)}</span></div>
                <div className="flex justify-between font-black text-slate-800 text-[10px] pt-1 border-t border-dashed">
                  <span>Total Amount Paid:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t space-y-2 bg-white">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleViewInvoice}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold py-2 px-3 rounded-lg text-[9px] uppercase tracking-wider text-center"
                >
                  View Invoice
                </button>
                <button
                  onClick={handleDownloadInvoice}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold py-2 px-3 rounded-lg text-[9px] uppercase tracking-wider text-center"
                >
                  Download PDF
                </button>
                <button
                  onClick={handlePrintInvoice}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-extrabold py-2 px-3 rounded-lg text-[9px] uppercase tracking-wider text-center"
                >
                  Print Invoice
                </button>
                <button
                  onClick={handleWhatsAppInvoice}
                  className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold py-2 px-3 rounded-lg text-[9px] uppercase tracking-wider text-center"
                >
                  WhatsApp Invoice
                </button>
              </div>
              <button
                onClick={handleResetAll}
                className={`w-full ${style.accent} text-white font-extrabold py-2.5 px-3 rounded-lg text-[9px] uppercase tracking-wider text-center`}
              >
                Order Again / Close
              </button>
            </div>
          </div>
        );
      })()}

      {screen === 'confirmation' && (() => {
        return (
          <div className="flex-grow flex flex-col justify-between p-6 bg-slate-900 text-white text-center rounded-b-2xl h-full max-h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto space-y-5 pb-24 scrollbar-none flex flex-col items-center justify-start pt-6">
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce mb-2">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h4 className="font-black text-xl text-white tracking-tight">Order Confirmed!</h4>
              <p className="text-[10.5px] text-slate-400 max-w-[280px]">
                Your food order has been successfully placed and routed directly to the kitchen display system (KDS).
              </p>

              <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-4 w-full text-left space-y-2.5 shadow-xl">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Order ID:</span>
                  <span className="font-mono text-emerald-400 font-extrabold">{orderPlaced?.id || orderPlaced?.orderId || 'ORD-99281'}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Table Number:</span>
                  <span className="text-white font-extrabold">{menu?.table?.tableNumber || 'Table 5'}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Payment Mode:</span>
                  <span className="text-white font-extrabold uppercase">{paymentOption === 'Razorpay' ? 'Paid Online' : 'Pay At Counter'}</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 border-t border-slate-700/50 pt-2.5 mt-1">
                  <span>Est. Prep Time:</span>
                  <span className="text-amber-400 font-extrabold flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 animate-pulse" /> 15 - 20 Mins
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                onClick={() => setScreen('status')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl text-[10px] uppercase tracking-wider text-center shadow-lg shadow-emerald-600/20"
              >
                Track Live Order Status
              </button>
              <button
                onClick={() => setScreen('menu')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-[9px] uppercase tracking-wider text-center"
              >
                Back to Menu
              </button>
            </div>
          </div>
        );
      })()}

      {screen === 'payment_failed' && (() => {
        return (
          <div className="flex-grow flex flex-col justify-between p-6 bg-slate-900 text-white text-center rounded-b-2xl">
            <div className="flex-grow flex flex-col justify-center items-center space-y-5">
              <div className="w-16 h-16 bg-rose-500/20 border border-rose-500/40 text-rose-400 rounded-full flex items-center justify-center shadow-lg shadow-rose-500/20 animate-bounce mb-2">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h4 className="font-black text-xl text-white tracking-tight">Payment Failed</h4>
              <p className="text-[10.5px] text-slate-400 max-w-[280px]">
                Your online payment transaction was declined or cancelled. No amount has been deducted.
              </p>

              <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl p-4 w-full text-left space-y-2.5 shadow-xl">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Status:</span>
                  <span className="text-rose-400 font-extrabold uppercase">Declined</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Payment Gateway:</span>
                  <span className="text-white font-extrabold">Razorpay Secure</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 border-t border-slate-700/50 pt-2.5 mt-1">
                  <span>Error Code:</span>
                  <span className="text-slate-300 font-mono">PAYMENT_USER_CANCELLED</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                onClick={() => handleConfirmRazorpayPayment()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 px-4 rounded-xl text-[10px] uppercase tracking-wider text-center shadow-lg shadow-emerald-600/20"
              >
                Retry Payment
              </button>
              <button
                onClick={() => setScreen('cart')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-[9px] uppercase tracking-wider text-center"
              >
                Return to Cart
              </button>
            </div>
          </div>
        );
      })()}

      {cartNotification && (
        <div className="absolute bottom-20 left-4 right-4 bg-emerald-600 text-white text-[10px] font-extrabold py-3 px-4 rounded-xl shadow-lg flex items-center justify-between animate-bounce z-50">
          <span>{cartNotification}</span>
          <button onClick={() => setCartNotification(null)} className="text-white hover:text-slate-200">✕</button>
        </div>
      )}

    </div>
  );
};

export default PublicQRMenu;
