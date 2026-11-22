 import { LinkButton } from '@/components/shared/LinkButton'
import { urls } from '@/constants'
import { CalendarDays } from 'lucide-react'
 
 const PreparAcademicSessionButton = () => {
   return (
        <LinkButton href={urls.sessionSetup}>
            <CalendarDays className="size-4" />
            Prepare Academic Session
        </LinkButton>
   )
 }
 
 export default PreparAcademicSessionButton