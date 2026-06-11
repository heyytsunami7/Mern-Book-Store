import React from 'react'
import { Outlet } from "react-router-dom"
import SideBar from './SideBar'
const DashboardLayout = () => {
  return (
    <div className='flex gap-4 flex-co md:flex-row'>
      <SideBar/>
      <Outlet/>
    </div>
  )
}

export default DashboardLayout