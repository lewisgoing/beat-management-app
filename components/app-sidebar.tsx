"use client"

import { useState, useEffect } from "react"
import { useMusic } from "@/components/providers/music-provider"
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarRail
} from "@/components/ui/sidebar"
import { Home, Library, Heart, Clock, Tag, FolderPlus, Settings, User, LogOut } from 'lucide-react'
import { motion } from "framer-motion"

export default function AppSidebar() {
  const { collections } = useMusic()
  const [activeItem, setActiveItem] = useState("library")
  
  // Dispatch custom event when sidebar navigation changes
  const handleNavChange = (view: string, collectionId?: string) => {
    setActiveItem(view)
    
    // Create and dispatch custom event
    const event = new CustomEvent('sidebar-nav-change', {
      detail: { view, collectionId }
    })
    window.dispatchEvent(event)
  }
  
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <motion.div 
          className="flex items-center"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold mr-2">
            ♥
          </div>
          <h1 className="text-xl font-bold">&lt;3&Soul</h1>
        </motion.div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.0 }}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeItem === "home"}
                    onClick={() => handleNavChange("home")}
                  >
                    <Home className="w-5 h-5" />
                    <span>Home</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.0 }}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeItem === "library"}
                    onClick={() => handleNavChange("library")}
                  >
                    <Library className="w-5 h-5" />
                    <span>Library</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeItem === "favorites"}
                    onClick={() => handleNavChange("favorites")}
                  >
                    <Heart className="w-5 h-5" />
                    <span>Favorites</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeItem === "recent"}
                    onClick={() => handleNavChange("recent")}
                  >
                    <Clock className="w-5 h-5" />
                    <span>Recent</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </motion.div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Collections</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {collections.map((collection, index) => (
                <motion.div
                  key={collection.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.0 }}
                >
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      isActive={activeItem === collection.id}
                      onClick={() => handleNavChange("collection", collection.id)}
                    >
                      <FolderPlus className="w-5 h-5" />
                      <span>{collection.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </motion.div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>Tags</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    isActive={activeItem === "tags"}
                    onClick={() => handleNavChange("tags")}
                  >
                    <Tag className="w-5 h-5" />
                    <span>Manage Tags</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </motion.div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={activeItem === "settings"}
              onClick={() => handleNavChange("settings")}
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton>
              <User className="w-5 h-5" />
              <span>Profile</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          <SidebarMenuItem>
            <SidebarMenuButton>
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      
      <SidebarRail />
      <SidebarTrigger className="absolute top-4 right-4 md:hidden" />
    </Sidebar>
  )
}