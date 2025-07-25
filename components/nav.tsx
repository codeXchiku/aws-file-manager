'use client'
import { UserButton } from '@clerk/nextjs'
import React from 'react'

const NavBar: React.FC = () => {
    return (
        <nav className='p-4 flex justify-between'>
            <div>
                <p className='font-bold'>S3 UI</p>
            </div>
            <div>
                <UserButton />
            </div>
        </nav>
    )
}

export default NavBar