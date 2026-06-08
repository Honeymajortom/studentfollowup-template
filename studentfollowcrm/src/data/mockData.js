// src/data/mockData.js
// Replace all of this with real Firestore queries once Firebase is connected.

export const STUDENTS = [
  { id:"STU001", name:"Priya Sharma",   mobile:"9876543210", parent:"9876543211", email:"priya@mail.com",   dob:"2002-04-12", gender:"Female", address:"12, MG Road, Nagpur",        course:"Full Stack Dev",   batch:"9AM–11AM",  duration:"6 Months", counselor:"Rahul Kulkarni", totalFees:35000, paid:35000, discount:0,    payMode:"UPI",  source:"Instagram",  leadStatus:"Enrolled",        followup:"2025-06-01", notes:"Interested in placement support.", status:"Active"    },
  { id:"STU002", name:"Arjun Mehta",    mobile:"9123456780", parent:"9123456781", email:"arjun@mail.com",   dob:"2001-11-03", gender:"Male",   address:"45, Civil Lines, Nagpur",    course:"Data Science",     batch:"11AM–1PM",  duration:"4 Months", counselor:"Sneha Patil",    totalFees:28000, paid:14000, discount:2000, payMode:"Cash", source:"Facebook",   leadStatus:"Enrolled",        followup:"2025-05-29", notes:"Asked about placement.",       status:"Active"    },
  { id:"STU003", name:"Neha Desai",     mobile:"9988776655", parent:"9988776656", email:"neha@mail.com",    dob:"2003-07-22", gender:"Female", address:"7, Dharampeth, Nagpur",      course:"UI/UX Design",     batch:"2PM–4PM",   duration:"3 Months", counselor:"Rahul Kulkarni", totalFees:18000, paid:0,     discount:1000, payMode:"—",   source:"Walk-in",    leadStatus:"Demo Scheduled",  followup:"2025-05-27", notes:"Needs demo class.",            status:"Follow-up" },
  { id:"STU004", name:"Karan Patel",    mobile:"9000011122", parent:"9000011123", email:"karan@mail.com",   dob:"2000-01-15", gender:"Male",   address:"23, Sadar, Nagpur",          course:"DevOps",           batch:"4PM–6PM",   duration:"5 Months", counselor:"Amit Waghmare",  totalFees:32000, paid:32000, discount:3000, payMode:"NEFT", source:"Referral",   leadStatus:"Enrolled",        followup:"2025-06-03", notes:"Referred by alumni.",          status:"Active"    },
  { id:"STU005", name:"Ananya Joshi",   mobile:"9111222333", parent:"9111222334", email:"ananya@mail.com",  dob:"2002-09-30", gender:"Female", address:"88, Sitabuldi, Nagpur",      course:"Full Stack Dev",   batch:"9AM–11AM",  duration:"6 Months", counselor:"Sneha Patil",    totalFees:35000, paid:10000, discount:0,    payMode:"EMI",  source:"Google",     leadStatus:"Interested",      followup:"2025-05-30", notes:"Fresh inquiry from Google.",   status:"New Lead"  },
  { id:"STU006", name:"Rohan Gupta",    mobile:"9333444555", parent:"9333444556", email:"rohan@mail.com",   dob:"2001-03-08", gender:"Male",   address:"34, Itwari, Nagpur",         course:"Data Science",     batch:"11AM–1PM",  duration:"4 Months", counselor:"Rahul Kulkarni", totalFees:28000, paid:28000, discount:0,    payMode:"UPI",  source:"Instagram",  leadStatus:"Enrolled",        followup:"2025-06-05", notes:"Very motivated.",              status:"Active"    },
  { id:"STU007", name:"Sneha Verma",    mobile:"9555666777", parent:"9555666778", email:"sneha@mail.com",   dob:"2003-12-18", gender:"Female", address:"66, Pratap Nagar, Nagpur",  course:"UI/UX Design",     batch:"2PM–4PM",   duration:"3 Months", counselor:"Sneha Patil",    totalFees:18000, paid:9000,  discount:0,    payMode:"Cash", source:"WhatsApp",   leadStatus:"Enrolled",        followup:"2025-06-08", notes:"",                             status:"Active"    },
  { id:"STU008", name:"Rahul Deshmukh", mobile:"9777888999", parent:"9777889000", email:"rahul@mail.com",   dob:"2000-06-25", gender:"Male",   address:"11, Wadi, Nagpur",           course:"Android Dev",      batch:"4PM–6PM",   duration:"4 Months", counselor:"Amit Waghmare",  totalFees:26000, paid:13000, discount:0,    payMode:"UPI",  source:"Referral",   leadStatus:"Enrolled",        followup:"2025-06-10", notes:"Wants Kotlin focus.",          status:"Active"    },
];

export const FOLLOWUPS = [
  { id:"FU001", studentId:"STU001", student:"Priya Sharma",   course:"Full Stack Dev",  lastDate:"2025-05-20", nextTime:"10:30 AM", nextDate:"2025-05-26", remarks:"Interested in EMI option, follow up on fee balance.", status:"Scheduled" },
  { id:"FU002", studentId:"STU002", student:"Arjun Mehta",    course:"Data Science",    lastDate:"2025-05-22", nextTime:"12:00 PM", nextDate:"2025-05-26", remarks:"Asked about placement guarantee. Send brochure.",     status:"Pending"   },
  { id:"FU003", studentId:"STU003", student:"Neha Desai",     course:"UI/UX Design",    lastDate:"2025-05-18", nextTime:"02:00 PM", nextDate:"2025-05-26", remarks:"Overdue — did not attend demo class. Call urgent.",    status:"Overdue"   },
  { id:"FU004", studentId:"STU005", student:"Ananya Joshi",   course:"Full Stack Dev",  lastDate:"2025-05-24", nextTime:"04:30 PM", nextDate:"2025-05-27", remarks:"Fresh inquiry from Google. Send intro message.",       status:"New"       },
  { id:"FU005", studentId:"STU006", student:"Rohan Gupta",    course:"Data Science",    lastDate:"2025-05-21", nextTime:"11:00 AM", nextDate:"2025-05-28", remarks:"Fee reminder — 2nd instalment due.",                  status:"Scheduled" },
];

export const COURSES = [
  { id:"CRS001", name:"Full Stack Development", duration:"6 Months", fees:35000, students:24, trainer:"Ravi Sharma",   desc:"React, Node.js, MongoDB, AWS",         emoji:"💻", color:"#2563EB" },
  { id:"CRS002", name:"Data Science & ML",       duration:"4 Months", fees:28000, students:18, trainer:"Priya Joshi",   desc:"Python, Pandas, TensorFlow, Sklearn",  emoji:"📊", color:"#7C3AED" },
  { id:"CRS003", name:"UI/UX Design",            duration:"3 Months", fees:18000, students:12, trainer:"Kiran Mehta",   desc:"Figma, Prototyping, User Research",    emoji:"🎨", color:"#0EA5E9" },
  { id:"CRS004", name:"DevOps & Cloud",          duration:"5 Months", fees:32000, students: 9, trainer:"Sanjay Kumar",  desc:"Docker, Kubernetes, CI/CD, AWS",       emoji:"⚙️", color:"#10B981" },
  { id:"CRS005", name:"Android Development",     duration:"4 Months", fees:26000, students: 7, trainer:"Amit Waghmare", desc:"Kotlin, Jetpack Compose, Firebase",    emoji:"📱", color:"#F59E0B" },
];

export const STAFF = [
  { id:"STF001", name:"Rahul Kulkarni",  role:"Senior Counselor", email:"rahul@eduspark.in",  phone:"9876500001", students:28, leads:12, converted: 9, performance:92, status:"Active",    joined:"2023-01-10" },
  { id:"STF002", name:"Sneha Patil",     role:"Counselor",        email:"sneha@eduspark.in",  phone:"9876500002", students:21, leads:10, converted: 7, performance:87, status:"Active",    joined:"2023-06-15" },
  { id:"STF003", name:"Amit Waghmare",   role:"Trainer",          email:"amit@eduspark.in",   phone:"9876500003", students:33, leads: 0, converted: 0, performance:95, status:"Active",    joined:"2022-08-01" },
  { id:"STF004", name:"Priya Nair",      role:"Admin",            email:"priya@eduspark.in",  phone:"9876500004", students: 0, leads: 0, converted: 0, performance:88, status:"Active",    joined:"2022-11-20" },
  { id:"STF005", name:"Vikram Singh",    role:"Counselor",        email:"vikram@eduspark.in", phone:"9876500005", students:15, leads: 8, converted: 5, performance:78, status:"On Leave",  joined:"2024-02-01" },
];

export const WA_TEMPLATES = [
  { id:1, name:"Follow-up Reminder",    emoji:"🔔", sent:124, body:"Hi {name}, this is a reminder for your scheduled follow-up call today at {time}. Please be available. — EduSpark Team" },
  { id:2, name:"Fee Reminder",           emoji:"💰", sent: 89, body:"Dear {name}, your fee installment of ₹{amount} is due on {date}. Kindly make the payment to avoid late charges. — EduSpark" },
  { id:3, name:"Demo Class Reminder",    emoji:"📚", sent: 45, body:"Hi {name}! Your FREE demo class for {course} is scheduled tomorrow at {time}. Don't miss it! — EduSpark Team" },
  { id:4, name:"Admission Confirmation", emoji:"✅", sent: 67, body:"Congratulations {name}! 🎉 Your admission to {course} is confirmed. Classes begin {date}. Welcome aboard! — EduSpark" },
  { id:5, name:"Attendance Reminder",    emoji:"📋", sent: 28, body:"Dear {name}, you have missed {days} classes in {course}. Please attend regularly. For queries call {phone}. — EduSpark" },
];

export const MONTHLY_STATS = [
  { m:"Jan", admissions:14, leads:22, conversions: 9 },
  { m:"Feb", admissions:18, leads:28, conversions:12 },
  { m:"Mar", admissions:22, leads:35, conversions:16 },
  { m:"Apr", admissions:19, leads:30, conversions:13 },
  { m:"May", admissions:28, leads:42, conversions:20 },
  { m:"Jun", admissions:25, leads:38, conversions:18 },
  { m:"Jul", admissions:32, leads:48, conversions:24 },
  { m:"Aug", admissions:29, leads:44, conversions:21 },
  { m:"Sep", admissions:35, leads:52, conversions:27 },
  { m:"Oct", admissions:38, leads:58, conversions:30 },
  { m:"Nov", admissions:42, leads:63, conversions:33 },
  { m:"Dec", admissions:45, leads:68, conversions:36 },
];

export const LEAD_SOURCES = [
  { name:"Instagram", value:34, color:"#E1306C" },
  { name:"Google",    value:28, color:"#4285F4" },
  { name:"Walk-in",   value:18, color:"#7C3AED" },
  { name:"Referral",  value:12, color:"#10B981" },
  { name:"Facebook",  value: 8, color:"#1877F2" },
];

export const REPORT_TYPES = [
  { title:"Admission Report",   emoji:"👥", color:"#2563EB", desc:"Monthly/weekly admission trends, source analysis, counselor-wise breakdown." },
  { title:"Fees Report",         emoji:"💰", color:"#10B981", desc:"Collection summary, pending dues, overdue payments, receipt logs."            },
  { title:"Follow-up Report",    emoji:"📅", color:"#7C3AED", desc:"Completion rate, missed follow-ups, counselor performance."                   },
  { title:"Staff Performance",   emoji:"👨‍💼", color:"#F59E0B", desc:"Lead conversion, student satisfaction scores, activity log."               },
  { title:"Course Performance",  emoji:"📚", color:"#0EA5E9", desc:"Enrollment per course, dropout rate, revenue per course."                    },
  { title:"WhatsApp Analytics",  emoji:"💬", color:"#22C55E", desc:"Message delivery rates, template performance, opt-out tracking."             },
];
