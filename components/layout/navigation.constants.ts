
import {
  BookOpen,
  BookOpenText,
  ChartNoAxesCombined,
  ClipboardList,
  ColumnsSettings,
  GraduationCap,
  LayoutDashboard,
  School,
  Settings2,
  UsersRound,
} from "lucide-react"

import { urls } from "@/constants"
import type { DashboardNavGroup } from "./navigation.types"

export const staffNavigation: DashboardNavGroup[] = [
  {
    label: "Workspace",
    items: [
      {
        title: "Overview",
        href: urls.dashboard,
        icon: LayoutDashboard,
        exact: true,
      },
      {
        title: "Question Bank",
        href: urls.questions,
        icon: BookOpen,
      },
      {
        title: "Set Exam",
        href: urls.examNew,
        icon: ClipboardList,
      },
      {
        title: "Examinations",
        href: urls.exams,
        icon: ClipboardList,
      },

      // {
      //   title: "Students",
      //   href: urls.students,
      //   icon: GraduationCap,
      //   children: [
      //     {
      //       title: "Student Directory",
      //       href: urls.students,
      //       exact: true,
      //     },
      //     {
      //       title: "Register New Students",
      //       href: urls.studentRegistration,
      //     },
      //     {
      //       title: "Enrollments",
      //       href: urls.enrollments,
      //     },
      //   ],
      // },
      {
        title: "Candidates",
        href: urls.candidates,
        icon: UsersRound,
      },
      {
        title: "Results",
        href: urls.results,
        icon: ChartNoAxesCombined,
      },
    ],
  },
  {
    label: "Organization",
    items: [
       {
        title: "School Information",
        href: urls.school,
        icon: School,
      },
      {
        title: "Academic Setup",
        href: urls.schoolAcademicSetup,
        icon: BookOpenText,
      },
     
      {
        title: "Students",
        href: urls.students,
        icon: GraduationCap,
        children: [
          {
            title: "Student Directory/Classes",
            href: urls.studentsDirectoryByEnrollment,
            exact: true,
          },
          {
            title: "Assign Students To Class ",
            href: urls.enrollments,
            exact: true,
            // icon: School,
          },
          {
            title: "Register Students",
            href: urls.studentRegistration,
            exact: true,
          },
          
          {
            title: "All Student Register",
            href: urls.studentsDirectoryByAdmission,
            exact: true,
          },
          
        ],
      },


      // {
      //   title: "Staff",
      //   href: urls.staff,
      //   icon: UsersRound,
      // },

      

      
    ],
  },

  {
    label: 'Admin Management',
    items: [
       {
        title: "Manage Student Accounts",
        href: urls.studentAccounts,
        icon: ColumnsSettings,
      },

       {
        title: "Settings",
        href: urls.settings,
        icon: Settings2,
      },
 
    ]
  }
]
