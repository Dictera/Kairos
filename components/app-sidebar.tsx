'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  FolderOpen,
  Users,
  Calendar,
  FileText,
  DollarSign,
  FileEdit,
  BarChart2,
  Settings,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'

const SIDEBAR_STORAGE_KEY = 'sidebar_collapsed'

const navGroups = [
  {
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
      { label: 'Dosyalar', href: '/dosyalar', icon: FolderOpen },
      { label: 'Müvekkiller', href: '/muvekkiller', icon: Users },
    ],
  },
  {
    items: [
      { label: 'Takvim', href: '/takvim', icon: Calendar },
      { label: 'Belgeler', href: '/belgeler', icon: FileText },
      { label: 'Finans', href: '/finans', icon: DollarSign },
      { label: 'Dilekçeler', href: '/dilekce', icon: FileEdit },
      { label: 'Raporlar', href: '/raporlar', icon: BarChart2 },
    ],
  },
]

const settingsItem = { label: 'Ayarlar', href: '/ayarlar', icon: Settings }

function SidebarCollapseSync() {
  const { open, setOpen } = useSidebar()

  // Read from localStorage once on mount — do not include setOpen in deps
  // (shadcn recreates setOpen on each render, causing an infinite loop if included)
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored !== null) {
      setOpen(stored !== 'true') // sidebar_collapsed=true means open=false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(!open))
  }, [open])

  return null
}

export function AppSidebar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isActive = (href: string) => mounted && pathname === href

  return (
    <Sidebar
      collapsible="icon"
      style={{ '--sidebar-background': '#134e4a' } as React.CSSProperties}
    >
      <SidebarCollapseSync />

      <SidebarContent>
        {navGroups.map((group, groupIndex) => (
          <React.Fragment key={groupIndex}>
            {groupIndex > 0 && <SidebarSeparator />}
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const active = isActive(item.href)
                    const Icon = item.icon
                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          isActive={active}
                          tooltip={item.label}
                          render={
                            <Link
                              href={item.href}
                              style={
                                active
                                  ? {
                                      borderLeft: '3px solid #14b8a6',
                                      backgroundColor: 'rgba(20, 184, 166, 0.12)',
                                      color: '#f0fdfa',
                                    }
                                  : {
                                      color: '#99f6e4',
                                      borderLeft: '3px solid transparent',
                                    }
                              }
                            />
                          }
                        >
                          <Icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </React.Fragment>
        ))}

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isActive(settingsItem.href)}
                  tooltip={settingsItem.label}
                  render={
                    <Link
                      href={settingsItem.href}
                      style={
                        isActive(settingsItem.href)
                          ? {
                              borderLeft: '3px solid #14b8a6',
                              backgroundColor: 'rgba(20, 184, 166, 0.12)',
                              color: '#f0fdfa',
                            }
                          : {
                              color: '#99f6e4',
                              borderLeft: '3px solid transparent',
                            }
                      }
                    />
                  }
                >
                  <settingsItem.icon />
                  <span>{settingsItem.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarTrigger />
      </SidebarFooter>
    </Sidebar>
  )
}
