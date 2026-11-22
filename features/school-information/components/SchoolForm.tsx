"use client"

import { SchoolProp } from '@/types/school'
 import { useState } from 'react'
 
import { Pencil } from 'lucide-react'
import { AppDrawer } from '@/components/shared/AppDrawer'
import { Button } from '@/components/ui/button'

const SchoolForm = ({school}:{school:SchoolProp}) => {
  return (
    <div>SchoolForm</div>
  )
}

export default SchoolForm

export const SchoolFormDrawer =({school}:{school:SchoolProp})  => {
      const [open, setOpen] = useState(false)
    return (
        <AppDrawer
            trigger={
              <Button onClick={() => setOpen(true)} size="lg" className='bg-primary-foreground text-primary hover:bg-primary-foreground /70 hover:text-primary'>
          <Pencil className="  size-4" />
          Edit Information
        </Button>
            }

            open={open}
        onOpenChange={setOpen}
        title="Edit School Information"
        >
            <SchoolForm  school={school}/>
        </AppDrawer>
    )
}