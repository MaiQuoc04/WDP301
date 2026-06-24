<a id="_djk20jpoil2t"></a>__Project: Hotel Booking Management System__
__Final Release Document__
__Group 5__
__Group Members__
Trß║ºn Ngß╗ìc T├║ \- HE181526
Phß║ím Nguyß╗àn Duy Ho├áng \- HE186613 
─Éß╗ù Minh S├íng \- HE186186 
Hß╗ô Ngß╗ìc Kh├ính \- HE170693 
Mai ─É├¼nh Bß║úo Quß╗æc \- HE186431 
__Supervisor/Lecturer__
─Éß╗ù Thß╗ï Loan
\- Hanoi, June 2026 \-
<a id="_egb179b7t9qm"></a>
__Table of Contents__
[__Definition and Acronyms	7__](#_nk4ahsnxb9o)
[__I\. Project Introduction	9__](#_o9tpk3dmssyt)
[1\. Overview	9](#_d1yf0b95vef9)
[1\.1 Project Information	9](#_deicgatu8qy9)
[1\.2 Project Team	9](#_82htizyv07u2)
[1\.3 Stakeholders \(End\-users\)	9](#_bcfbxt67e08i)
[2\. Product Background	9](#_qm4scd25qjcr)
3\. Existing Systems	9
[4\. Business Opportunity	10](#_cdk16t36qcnb)
[5\. Software Product Vision	10](#_aavgejlfhvx0)
[__II\. Project Management Plan	11__](#_74abrt96frjj)
[1\. Overview	11](#_sycj6h2cxoo8)
[1\.1 Scope & Estimation	11](#_y7ozawnj0mau)
[1\.2 Project Objectives	12](#_hhcuopu84gvc)
[1\.2\.1\. Project management	12](#_8eghzb2o8mvu)
[1\.2\.2\. Allocated effort	12](#_rgh9ccw0vq24)
[1\.3 Project Risks	13](#_555rps1yw5yf)
[2\. Management Approach	14](#_ww4mwva9c9zo)
[2\.1 Project Process	14](#_xwbrduk7jz46)
[2\.2 Quality Management	15](#_vs3t3vipgntd)
[2\.3 Training Plan	15](#_dja8r9af182b)
[3\. Project Deliverables	15](#_8vagqp4coxm9)
[4\. Responsibility Assignments	16](#_9hxkqyft3i34)
[4\.1\.Team & Structures	16](#_9a88ma2s5ofy)
[4\.2 Roles & Responsibilities	17](#_1a59ktb3d7wt)
[5\. Communications Plan	17](#_pyrug12y6h2)
[6\. Configuration Management	18](#_oixh8wfkbi17)
[6\.1 Document Management	18](#_8fotqd5i2e70)
[6\.2 Source Code Management	18](#_fkjb9nncpfsm)
[6\.3 Tools & Infrastructures	18](#_sdo5q8f3mj2e)
[__III\. Software Requirement Specification	19__](#_6bnzk3n5mngt)
[1\. Product Overview	19](#_t81j5u5mt1bg)
[2\. User Requirements	19](#_ericdva9ual3)
[2\.1 Actors	19](#_7cno86pqt6pe)
[2\.2 Use Cases	19](#_rf2m0jwtyw5q)
[2\.2\.1 Diagram	19](#_jlm8tcxpi04j)
[2\.2\.2 Descriptions	20](#_hzfpb9uea16r)
[3\. Functional Requirements	20](#_5hqaez1qu8vc)
[3\.1 System Functional Overview	20](#_5pnz8lm2rddv)
[3\.1\.0 Business Flow	20](#_bg8mkmjdfgs3)
3\.1\.1 Screens Flow	21
[3\.1\.1\.1 Guest Flow	21](#_ope5pr8uxz3d)
[3\.1\.1\.2 Admin Flow	21](#_4er3mak89sgc)
[3\.1\.1\.3 User Flow	23](#_faz6yeo0sl55)
3\.1\.2 Screen Descriptions	23
3\.1\.3 Screen Authorization	24
3\.1\.4 Non\-Screen Functions	25
[3\.1\.5 In/Out of scope	25](#_s0c9sjdstbjl)
3\.2 Feature description	26
[3\.2\.1\. Login	26](#_pj9gne16s33w)
[3\.2\.2\. Logout	26](#_xd9k5xejmx56)
[3\.2\.3\. View Profile	27](#_tc0qsspf90d7)
[3\.2\.4\. Edit Profile	28](#_ncbsskr6aier)
[3\.2\.5\. View facility list	28](#_dbz5bu33hu3h)
[3\.2\.6\. View facilities detail	29](#_rz6cu36fctg8)
[3\.2\.7\. Evaluate	30](#_ogwl3brqyfro)
[3\.2\.8\. Create booking	30](#_hme1auur2jhk)
[3\.2\.9\. View notification list	31](#_ewwc3rltay1s)
[3\.2\.10\. Chat	32](#_m4jsx0r2u5p3)
[3\.2\.11\. View booking list	32](#_j4pgfxovi0e7)
[3\.2\.12\. Booking processing	33](#_n29zi3jby7d9)
[3\.2\.13\. Block/Unblock Account	34](#_92wlhisvd7xr)
[3\.2\.14\. View Statistic	34](#_lrsvcdo56c1x)
[3\.2\.15\. Create Facility	35](#_jz5prmnbg0fb)
[3\.2\.16\. Update Facility	36](#_w3ya3vtlr8ol)
[3\.2\.17\. View facility updating history	37](#_pl25ebstvigu)
[3\.2\.18\. Active/Inactive facility	37](#_5ylomxgqxk95)
[3\.2\.19\. Create category	38](#_ibzdqj3yfif9)
[3\.2\.20\. Update category	39](#_pl169pogjew0)
[3\.2\.21\. View category updating history	40](#_1jh71gm0r3a3)
[4\. Non\-Functional Requirements	41](#_ambu7ab64fa5)
[4\.1 External Interfaces	41](#_bdvobnjcp9z6)
[4\.1\.1\. User interfaces	41](#_rda5f6lp3ul7)
[4\.2\.2 Security interfaces	41](#_kh1i7qvzh1b2)
[4\.2 Quality Attributes	41](#_jjaj2qfhz2dz)
[4\.2\.1 Usability	41](#_tagg1sg7be47)
[4\.2\.2 Reliability	41](#_67h223ficsd7)
[4\.2\.3 Performance	41](#_tvpzhkak1vef)
4\.2\.4 Security	41
5\. Requirement Appendix	42
[5\.1 Business Rules	42](#_t7zupyi3hh6n)
5\.2 Application Messages List	42
[__IV\. Software Design Description	44__](#_oto4glkum4ia)
[1\. System Design	44](#_ntmjw9q83o0f)
[1\.1 System Architecture	44](#_d2mwlc9rrsd8)
[1\.2 Package Diagram	44](#_exgog6i27if3)
[2\. Database Design	47](#_6pjk2kbk48b9)
[3\. Detailed Design	49](#_auzd8whkwnu0)
[3\.1 Login	50](#_s0qi3i9nruh8)
[3\.1\.1 Class Diagram	50](#_3k3o26yq0ifx)
[3\.1\.2\. Sequence Diagram	51](#_vncxqmdofx5c)
[3\.2 Manage User	52](#_z4xz1qmj4ud3)
[3\.2\.1 View User	52](#_azgakkg68gm2)
[3\.2\.1\.1 Class Diagram	52](#_89qvszba3keb)
[3\.2\.1\.2 Sequence Diagram	52](#_go325p4kl2ba)
[3\.2\.2 Update User	53](#_mctc0vd8dbou)
[3\.2\.2\.1 Class Diagram	53](#_ir3vic4laam6)
[3\.2\.2\.2 Sequence Diagram	54](#_z7u11ccecv39)
[3\.2\.3 View user profile	55](#_vg7pjujv39xt)
[3\.2\.3\.1 Class Diagram	55](#_9nowfbnhdz9e)
[3\.2\.3\.2 Sequence Diagram	55](#_c9ortnidzqvy)
[3\.2\.4 Search Account	56](#_9gdb84ophcx)
[3\.2\.4\.1 Class Diagram	56](#_ct7x4jb6embj)
[3\.2\.4\.2 Sequence Diagram	56](#_eq7mutljun)
[3\.2 Manage Booking	58](#_ogs0222alli3)
[3\.2\.1 View Booking	58](#_eyzw7lx4tzxs)
[3\.2\.1\.1 Class Diagram	58](#_86nncjzaz96f)
[3\.3\.1\.2 Sequence Diagram	58](#_j4ao8viajb3m)
[3\.2\.2 Find booking by user and facility	59](#_izqpbqybqkmk)
[3\.2\.2\.1 Class Diagram	59](#_shjnyerwum41)
[3\.3\.2\.3 Sequence Diagram	60](#_88uf5nnykrs)
[3\.2\.3 Update Booking	60](#_4ajeh6tar249)
[3\.2\.3\.1 Class Diagram	60](#_dcnect11aisu)
[3\.2\.3\.2 Sequence Diagram	61](#_hqghag5rtqs9)
[3\.2\.4 Create Booking	61](#_ug072nddxgbz)
[3\.2\.4\.1 Class Diagram	61](#_bxxg7cj2tem8)
[3\.2\.4\.2 Sequence Diagram	62](#_vj6wredof57i)
[3\.2\.5 Status Booking	63](#_t8el9d7cp9u0)
[3\.2\.5\.1 Class Diagram	63](#_ul3eg17ak87e)
[3\.2\.5\.2 Sequence Diagram	64](#_n77k6k2zyhe)
[3\.2\.6 Dashboard by year	64](#_u2lthxw1o4en)
[3\.2\.6\.1 Class Diagram	64](#_k9hpr5tezhlq)
[3\.2\.7 Dashboard by week	66](#_a991hueojrcj)
[3\.2\.7\.1 Class Diagram	66](#_vszmzlckxe)
[3\.3 Manage Facility	67](#_rmx0wbvdg0ge)
[3\.3\.1 View Facility	67](#_895996ef4r0y)
[3\.3\.1\.1 Class Diagram	67](#_6scewjyfi3hi)
[3\.3\.1\.2 Sequence Diagram	68](#_m729n3egjo58)
[3\.3\.2 Create Facility	68](#_7nz8btkopddt)
[3\.3\.2\.1 Class Diagram	68](#_uw98yaxxdmie)
[3\.3\.2\.2 Sequence Diagram	69](#_dsfcf6f9hd5x)
[3\.3\.3 Update Facility	70](#_8qi6f1x7a4p4)
[3\.3\.3\.1 Class Diagram	70](#_pqfn0krqipgu)
[3\.3\.3\.2 Sequence Diagram	71](#_mu4nh4z8qva)
[3\.3\.4 Change Status Facility	72](#_ey3vij5ih36s)
[3\.3\.4\.1 Class Diagram	72](#_kpow9zcnuasl)
[3\.3\.4\.2 Sequence Diagram	73](#_lueaawh8fys1)
[3\.3\.5 View Detail Facility	74](#_dq8f3kqm4rki)
[3\.3\.5\.1 Class Diagram	74](#_mnrdmxa5m44n)
[3\.3\.5\.2 Sequence Diagram	74](#_qqcsg5lvdjbl)
[3\.4 Manage Category	75](#_iud06qfbejh3)
[3\.4\.1 View Category	75](#_2djvfp19330g)
[3\.4\.1\.1 Class Diagram	75](#_wenx2d9uhijr)
[3\.4\.1\.2 Sequence Diagram	75](#_x7jah5hvnv87)
[3\.4\.2 Create Category	76](#_vm4u22m5u2pn)
[3\.4\.2\.1 Class Diagram	76](#_wr00mln6sbi)
[3\.4\.2\.2 Sequence Diagram	76](#_ob9q1l1foe1v)
[3\.4\.3 Update Category	77](#_bdaez48ni04v)
[3\.4\.3\.1 Class Diagram	77](#_ps157anfil27)
[3\.4\.3\.2 Sequence Diagram	77](#_26ssmmjtryjc)
[3\.5 Manage Comments	78](#_257fytvfn6ga)
[3\.5\.1 View Comment	78](#_cs9t7zw1y6ig)
[3\.5\.1\.1 Class Diagram	78](#_27ximexuwuit)
[3\.5\.1\.2 Sequence Diagram	78](#_vx7wr6jv68fc)
[3\.5\.2 Create Comment	79](#_teqt4dhyozv3)
[3\.5\.2\.1 Class Diagram	79](#_upuqghfmni07)
[3\.5\.2\.2 Sequence Diagram	79](#_ek28zc6sh4b3)
[3\.5\.3 Check Comment Permission	79](#_qu24uawbmlf)
[3\.5\.3\.1 Class Diagram	79](#_efxs04m28456)
[3\.5\.3\.2 Sequence Diagram	80](#_495pv3dsswuy)
[3\.6 Manage Notification	81](#_j1rtydgniup1)
[3\.6\.1 View notification	81](#_83sf4m97u127)
[3\.6\.1\.1 Class Diagram	81](#_qjmfj7f2t4qb)
[3\.6\.1\.2 Sequence Diagram	81](#_92vye9y9hhno)
[3\.6\.2 Update Notification	82](#_fu52wwb8p6c)
[3\.6\.2\.1 Class Diagram	82](#_9em9lokxxjub)
[3\.6\.2\.2 Sequence Diagram	82](#_toexn9rvldm1)
__V\. Software Testing Documentation	83__
[1\. Scope of Testing	83](#_mrpe8f34hdu)
1\.1\. Testing Stages	83
[1\.2\. Range of Testing	84](#_76w5u7631427)
[2\. Test Strategy	84](#_96fuklbn19r0)
[2\.1 Testing Types	84](#_b7o0wikj3fn3)
[2\.2 Test Levels	84](#_4yaoubwp9n8b)
[2\.3 Supporting Tools	85](#_bn34hc8mjij9)
[3\. Test Plan	86](#_l4o5dc9avq5l)
[3\.1 Human Resources	86](#_ih2krl18s8gs)
[3\.2 Test Environment	86](#_wdnehy4kmzdd)
[3\.3 Test Milestones	86](#_ot2klzqwx7a5)
[__VI\. Release Package & User Guides	88__](#_sdlbcks83ytt)
[1\. Deliverable Package	88](#_mrrxpla6ntec)
[2\. Installation Guides	88](#_cjfgwndyr592)
[2\.1 System Requirements	88](#_7npoupsmz3lk)
[2\.2 Hosting requirement	88](#_d67xxg5926hf)
[3\. User Manual	88](#_o92uomoljtqc)
[3\.1 Overview	88](#_jyl4jv723cu6)
[3\.2 Role User	88](#_nabxhl9le04o)
[3\.3 Admin Role	95](#_jky4wtrbodsu)
# <a id="_nk4ahsnxb9o"></a>__Definition and Acronyms __
__Acronym__
__Definition__
BA
Business Analysis
BR
Business Rule
ERD
Entity Relationship Diagram
UI
User Interface
PM
Project Manager
SDD
Software Design Description
SPMP
Software Project Management Plan
SRS
Software Requirement Specification
UC
Use Case
FMS
Facilities Management System
ST
System Testing
UT
Unit Test
IT
Integration Testing
AT
Acceptance Testing
# <a id="_o9tpk3dmssyt"></a>__I\. Project Introduction__
## <a id="_d1yf0b95vef9"></a>__1\. Overview__
### <a id="_deicgatu8qy9"></a>__1\.1 Project Information__
- Project name: __Hotel Booking Management System\.__
- Project code: __HBMS__
- Group name: SE1918\_NJ\_G5
- Software type: Web\-based Application
- Timeline: 11/05/2026 \- 23/07/2024
### <a id="_82htizyv07u2"></a>__1\.2 Project Team__
Full__ Name__
__Role__
__Email__
  Mai ─É├¼nh Bß║úo Quß╗æc 
Project Manager & Dev
quocmdbhe186431@fpt\.edu\.vn
  Hß╗ô Ngß╗ìc Kh├ính 
 Dev
khanhhnhe170693 @fpt\.edu\.vn
Trß║ºn Ngß╗ìc T├║
 Dev
tutnhe181526@fpt\.edu\.vn
─Éß╗ù Minh S├íng 
 Dev
sangdmhe186186@fpt\.edu\.vn
Phß║ím Nguyß╗àn Duy Ho├áng 
 Dev
hoangpndhe186613@fpt\.edu\.vn
__*Table I\.1*__*: Team member*
## <a id="_qm4scd25qjcr"></a>__2\. Product Background__
__Hotel Booking Management System \(HBMS\) __is an effective solution designed to optimize the operation and management of modern hotel chains\. The system includes two main components: Dashboard Management: Provides a powerful management interface for hotel staff and management, allowing real\-time monitoring, customer management, service, financial control and business data analysis\. Customer homepage: Friendly and intuitive interface, allowing customers to easily search, compare and book rooms online\. Customers can view detailed information about rooms, services, prices and book rooms quickly and conveniently\. The system not only improves operational management efficiency but also creates a smooth booking experience for customers, thereby increasing revenue and building customer loyalty for the hotel chain\.
## <a id="_ar0y9sndwkcb"></a>__3\. Existing Systems__
### <a id="_txjk0h8e3jl"></a>__3\.1 Analysis and Evaluation of Existing Systems in the Market__
Current hotel management systems have made notable progress in supporting hotel operations\. Below is an overview of their strengths and limitations:
Strengths:
- __Booking Management:__ Most existing systems offer online booking capabilities, allowing guests to easily search, compare, and reserve rooms that meet their preferences\.
- __Flexible Payment Options:__ They support various payment methods, including partial or full prepayment, helping hotels secure revenue in advance\.
- __Basic Staff Management:__ Some systems provide basic tools for assigning housekeeping or maintenance tasks to staff members\.
Limitations:
- __Limited Multi\-Property Management:__ Many current systems struggle to efficiently handle multiple hotels under the same chain, complicating data consolidation and reporting processes\.
- __Weak Integration of Additional Services:__ Extra services such as massage, dining, or extended room hours are often poorly integrated into the billing flow, leading to fragmented management\.
- __Lack of Advanced Data Analytics:__ Most systems offer limited tools for analyzing business performance, forecasting revenue, or evaluating operational efficiency across branches\.
- __Complex User Interfaces:__ Some interfaces are overly complicated, posing difficulties for staff with limited technical expertise\.
### <a id="_ll5smk6cvn8n"></a>__3\.2 Purpose of the Project System__
The goal of our proposed hotel chain management system is to overcome these shortcomings while offering distinctive advantages\.
Objectives:
- __Optimize Multi\-Branch Management:__ Designed to handle multiple hotel branches within a single chain, enabling centralized data collection, management, and reporting across all locations\.
- __Enhance Customer Experience:__ Delivers a streamlined online booking flow with deposit payment via QR code, real\-time booking confirmation, and clear communication through automated email notifications\.
- __Improve Staff Productivity:__ Enables clear role\-based task assignment ΓÇö including automated housekeeping task creation upon guest check\-in ΓÇö so each staff member knows exactly what to do and when\.
- __Enable Data\-Driven Decision Making:__ Provides real\-time business analytics, revenue tracking, and operational performance insights at both branch and enterprise levels to support strategic decisions\.
### <a id="_90gomb9ffvah"></a>__3\.3 Key Differentiators of Our System__
Our system distinguishes itself from existing market solutions through the following features:
__Integrated Multi\-Branch Management:__
- Goes beyond traditional booking management by integrating extra services, amenity tracking, and automated housekeeping task scheduling within a unified platform\.
- Includes real\-time room status tracking through a Room Calendar for easy and intuitive monitoring across all branches\.
__Comprehensive Multi\-Role Access:__
- Defines clear, role\-based permissions for six user types: Guest, Customer, Receptionist, Housekeeper, Branch Manager, and Super Admin\.
- Provides tailored interfaces and functionalities for each role, ensuring efficiency and ease of use at every level of operation\.
__Automated Housekeeping Workflow:__
- Automatically generates housekeeping tasks when a guest checks in, with status tracking from assignment through completion\.
- Housekeepers can report missing amenities directly within their task, which are instantly reflected in the guest's bill ΓÇö eliminating manual communication between departments\.
__Integrated Extra Services & Billing:__
- Receptionists can add extra services \(e\.g\., massage, dining, extended room hours\) directly to a booking's bill during the guest's stay\.
- All charges ΓÇö room fees, extra services, and missing amenities ΓÇö are consolidated in real\-time in a single Bill tab, ensuring accurate and transparent check\-out\.
__Advanced Revenue Analytics:__
- Generates detailed revenue reports by branch, including expected revenue, deposit collected, remaining balance, and completed revenue\.
- Tracks booking patterns, room occupancy rates, and housekeeping performance metrics \(e\.g\., missed task rate\) as key operational KPIs\.
__Modern Technology Integration:__
- Supports Google account login and standard email/password registration with OTP verification for user convenience and security\.
- Integrates with PayOS/VietQR for seamless online deposit payment, with automatic booking confirmation upon successful transaction\.
## <a id="_cdk16t36qcnb"></a>__4\. Business Opportunity__
__Hotel Booking Management System \(HBMS\) __is a modern solution that overcomes the limitations of current hotel management platforms in the market\. The system provides fast online and counter booking support with convenient customer service\. These improvements not only improve booking efficiency, customer service and resource allocation but also enhance customer satisfaction more deeply\. In the context of digital transformation that is increasingly popular with every industry including the hotel industry, HMS provides a scalable and
future\-ready system, specifically designed to meet the ever\-changing needs of hotel operators and customers\. This advanced solution represents a significant business opportunity in the hotel management system market\.
## <a id="_3w73o8lh08q7"></a>
## <a id="_aavgejlfhvx0"></a>__5\. Software Product Vision__
__Hotel Booking Management System \(HBMS\) __envisions a new era where hotels are not merely places to stay, but intelligent, adaptive environments centered around customer experience\. With its modern and intuitive interface, HBMS redefines how guests interact with hotel services and how hotel operations are managed across multiple locations\.
The system offers a personalized booking experience, real\-time virtual concierge support, and an interactive digital space where guests can provide feedback and customize their services\. At the same time, HBMS streamlines internal operations by automating routine tasks such as room allocation, housekeeping scheduling, and performance analysis ΓÇö allowing staff to focus on delivering exceptional guest experiences\.
By combining advanced technology with user\-friendliness and scalability, HBMS bridges the gap between traditional hotel systems and the evolving expectations of
modern travelers, fostering a smarter, more connected, and experience\-driven hotel ecosystem\.
# <a id="_74abrt96frjj"></a>__II\. Project Management Plan__
## <a id="_sycj6h2cxoo8"></a>__1\. Overview__
### <a id="_y7ozawnj0mau"></a>__1\.1 Scope & Estimation__
Table II\.1 The WBS \(Work Breakdown Structure\) items are categorized into three levels of complexity \(Simple, Medium, Complex\) and estimate the total effort to complete each item in man\-day \(1 man\-day = 8 working hours\)
__WBS ID__
__WBS Item__
__Complexity__
__Est\. Effort \(man\-days\)__
__1\. Project Management__
1\.1
Project Initiation
Normal
1
1\.2
Project Planning
Complex
2
Total :
3
__2\. Project Designing__
2\.1
Gathering and collecting requirement with Team member and Lecture
Normal
4
2\.2
Create Project Introduction document
Simple
1\.5
2\.3
Define project scope and objectives
Complex
1
2\.4
Learn about similar Facilities Management System
Normal
2
2\.5
Create Project Timeline and Schedule
Normal
5
2\.6
Designing Screenflow \(Guest, User, Admin\)
Normal
5
2\.8
Designing basis of layout \(Concept, Feature, Requirement\)
Complex
5
2\.9
Identify and mitigate project risks
Normal
3
2\.10
Creating Test Plan
Normal
2
Total :
28\.5
__3\. Project Development__
3\.1
Prototyping Project
Complex
5
3\.2
Develop product prototype
Complex
7
3\.3
Conduct product testing and validation
Complex
5
3\.4
Develop front\-end design
Complex
10
3\.5
Develop back\-end functionality
Complex
35
3\.6
Implement security measures
Complex
5
3\.7
Create Test \(IT, UT, ST\) along coding
Normal
10
Total :
77
__4\. Quality Assurance & Testing__
4\.1
Conduct functional testing
Normal
5
4\.2
Conduct usability testing
Normal
5
4\.3
Testing and Fixing bugs
Normal
5
Total :
15
__Total Estimated Effort \(man\-days\)__
__123\.5__
__*Table II\.1*__*: Scope & Estimation*
### <a id="_hhcuopu84gvc"></a>__1\.2 Project Objectives__
#### <a id="_8eghzb2o8mvu"></a>__*1\.2\.1\. Project management*__
Table II\.2: describes the project management \.
__No__
__Objectives__
1
Project will release before 23/07/2026
2
Deliver screen design after 2 first sprint
3
Sprint goals are fully completed
4
Release product reduce 80% manual process
__*Table II\.2*__*: Project management*
#### <a id="_rgh9ccw0vq24"></a>__*1\.2\.2\. Allocated effort*__
Table II\.3: describes the allocated effort
__\#__
__Member__
__Weekdays__
__Weekends__
1
__Trß║ºn Ngß╗ìc T├║ __
2 hours
4 hours
2
__Phß║ím Nguyß╗àn Duy Ho├áng __
2 hours
4 hours
3
__─Éß╗ù Minh S├íng__
2 hours
4 hours
4
__Hß╗ô Ngß╗ìc Kh├ính __
2 hours
4 hours
5
__Mai ─É├¼nh Bß║úo Quß╗æc__
2 hours
4 hours
__*Table II\.3*__*: Allocated effort*
### <a id="_555rps1yw5yf"></a>__1\.3 Project Risks__
Table II\.4 Describe the possible risks of the project
 __People Risk__ is the Human Factor of the Risks\. Risk like a teammate is in sickness, accident, late arrival, Any communication hardness between remember or even stakeholder with team is considered to be a People Risk\. 
__Process Risk__ is the Risk that emerges when working on Project Management\. Project Risk like budgeting cost more than its planned, inadequate quality assurance and other related to Project Management\.
__System Risk __ associated with technical issues, such as the failure of hardware, software, or network infrastructure that could impact project performance, data integrity, or security\. 
__External Event Risk__ is External events such as natural disasters, pandemics, economic downturns, or geopolitics upheavals can significantly impact project success\.
__Legal and Compliance Risk__ often associated with legal or regulatory requirements that could impact project outcomes\. Legal and compliance risks can arise from issues such as intellectual property infringement, breach of contract, regulatory violations, or environmental risks\.
\#
Risk Description
Impact
Possibility
 Response Plans
1
Requirement  
changes\. 
Medium
Medium
All members discuss carefully the project  requirements before starting  
implementation\.
2
Members have  argued,conflicted with  others, leads to  stressful working environments\.
Medium
High
Define clear tasks for each member
and agree on ideas before starting work\.
3
Illness or absence of team  members so  that they cannot complete tasks  under deadline
Low
Medium
Members have to  notify the team  
about illness or absence period and  the plan of how to keep up with the work process\.
4
Members lack the knowledge and skills to complete a particular task
High
Medium
Training all members before starting the project\.
5
The library used  in the project is  no longer supported
Low
Low
Choose a reputable library with active  maintenance on GitHub\.
__*Table II\.4*__*: Project Risks*
## <a id="_ww4mwva9c9zo"></a>__2\. Management Approach__
### <a id="_xwbrduk7jz46"></a>__2\.1 Project Process__
Figure II\.5 Describe the project process of the project
__*Figure II\.5*__*: Project Process*
After researching the software development model carefully, the project will use the  Agile \- Scrum Software Process Model\. In an Iterative & Incremental model, Scrum software process model is an agile approach to project management that emphasizes iterative development, flexibility, and collaboration\. Scrum is a widely adopted framework because it offers numerous benefits over traditional software development methodologies\.
### <a id="_lr22qe5dtryj"></a>
### <a id="_vs3t3vipgntd"></a>__2\.2 Quality Management__
__*2\.2\.1 Defect Prevention: *__
- If any defect is found, the related person must be notified immediately at that time\.
- Defects must be carefully evaluated such as "How bad is the defect and can it damage  the system?", "How long is the time to fix that defect?"\. 
- The deadline for fixing the defect must be specified clearly\. 
- There is always a plan to prepare for what could happen at any time\. 
__*2\.2\.2 Reviewing: *__
- The curator must be honest and not biased towards any of the project members\. If  there is an error, the person must immediately notify the person responsible for the  defect\. 
- Defects should be recorded on the Bug Tracking software with details such as priority\. 
- The person responsible for defects found must\-have solutions to fix the defect as  quickly as possible\. 
### <a id="_dja8r9af182b"></a>__2\.3 Training Plan__
Table II\.6 Describe the training plan of the project
__Training Area__
__Participants__
__When, Duration__
__Waiver Criteria__
NodeJS
All members
1 days
Mandatory
Meeting Note
All members
15 minutes
Mandatory
Github
All members
30 minutes
Mandatory 
MongoDB
All members
30 minutes
Mandatory 
NextJS
All members
1 days
Mandatory 
Postman
All members
15 minutes
Mandatory
__*Figure II\.6*__*: Training plan*
## <a id="_8vagqp4coxm9"></a>__3\. Project Deliverables__
Figure II\.7\. Describe the project delivery of the project
__*Figure II\.7*__*: Project Deliver*
Project used Sprint Plan to manage task and estimate for new sprint every week
For more details, click to this 	[Jira\.com](https://fpt-team-rtprlhk3.atlassian.net/jira/plans/1/scenarios/1/timeline?vid=3)
## <a id="_9hxkqyft3i34"></a>__4\. Responsibility Assignments__
### <a id="_9a88ma2s5ofy"></a>__4\.1\.Team & Structures __
Figure II\.8 Describe the team & structures of project
### <a id="_hn7ln2bryo7n"></a>
__*Figure II\.8*__*: Team & Structures*
### <a id="_1a59ktb3d7wt"></a>__4\.2 Roles & Responsibilities__
Table II\.9 Describe the roles & responsibility of the project
__Role __
__Responsibility__
Project Manager
- Planning, developing schedules, coordinating communication, responsible for keeping the teamΓÇÖs focus  on the main goal\.
- Research and implement UX design for the front\-end\.
BA
- Analyze requirements\. 
- Define scope and create an SRS document\. 
- Design entity relationship diagram\.
- Define business process flow and object state\. 
- Capture and specifically describe the use case\.
Technical Leader
- Define high\-level architecture based on SRS\.
- Implement configuration and web server\. 
Front\-End / Back\-End
Developer
- Involve in coding the product and reviewing the code of  other developers\.
Tester
- Create a template testing document\. 
- Define test strategy, create test case
- Implement test cases and log defects\.
__*Table II\.9*__*: Roles & Responsibilities*
## <a id="_pyrug12y6h2"></a>__5\. Communications Plan__
Figure II\.10 Describe the communication plan of the project
__Communication Item__
__Who/ Target__
__Purpose__
__When, Frequency__
__Type, Tool, Method\(s\)__
Team meeting
All team members
Review plan, schedule, code, design, test and document
Once every 3 days
Online \- Google meet
Weekly meeting with mentor/lecturer
All team members
Gather requirements, review project,
log issue, define next week plan
Tuesday and Friday every week
Offline
On\-going Assessment Meeting
All team members
Evaluate project after every iteration
Once every 3 weeks
Offline
Unscheduled meeting
All team members
Discuss and solve important problems
When someone has
important problems
Online \- Google meet
__*Table II\.10*__*: Communications Plan*
## <a id="_oixh8wfkbi17"></a>__6\. Configuration Management__
### <a id="_8fotqd5i2e70"></a>__6\.1 Document Management__
### <a id="_fkjb9nncpfsm"></a>__6\.2 Source Code Management__
Source code is managed by Git on [WDP301 / FA25\_WDP301\_SE1916\_G5\_HMS ┬╖ GitLab](https://github.com/MaiQuoc04/WDP301.git)
### <a id="_sdo5q8f3mj2e"></a>__6\.3 Tools & Infrastructures__
Table II\.11 Describe the tool & infrastructures of the project
__Category__
__Tools / Infrastructure__
__Technology__
NodeJS
__Database__
MongoDB
__IDEs/Editors__
Visual Studio Code
__Diagramming__
DrawIO
__Documentation__
Microsoft Office, Google Docs/Sheets/Slides
__Version Control__
GitHub\(Source Codes\), Google Drive \(Documents\)
__Project management__
Jira \(Schedule\), GitHub \(Tasks, Defects\)
__*Table II\.11*__*: Tools & Infrastructures*
# <a id="_6bnzk3n5mngt"></a>__III\. Software Requirement Specification__
## <a id="_t81j5u5mt1bg"></a>__1\. Product Overview__
__The Hotel Booking Management System \(HBMS\)__ is a comprehensive solution designed to optimize the operation and management of modern hotel chains\. The system consists of two main components: Dashboard Management: Provides strong management interface for employees and hotel management, allows monitoring, customer management, financial control and business data analysis in real time\.Home page for customers: Friendly and intuitive interface, allowing customers to easily find, compare and book online\. Customers can view detailed information about rooms, services, prices and can make booking quickly and conveniently\. The system not only improves the efficiency of operation management, but also creates a booking seamless experience for customers, thereby increasing the revenue and building loyalty of customers for the hotel chain\.
### <a id="_l53nksmg9cyn"></a>__1\. __<a id="kix.jiqlzx3q2qyp"></a><a id="kix.alvhui9gb2gb"></a>__Context Diagram__
## <a id="_ericdva9ual3"></a>__  2\. User Requirements__
### <a id="_7cno86pqt6pe"></a>__2\.1 Actors__
Table III\.1 Describe the project delivery of the project
__\#__
__Actor__
__Description__
1
Guest 
An unauthenticated user who can browse available rooms and search for vacancies across branches without logging in 
2
Customer 
A registered and verified user who can make room bookings, pay deposits online, and view booking history 
3
Receptionist 
A branch staff member who manages walk\-in bookings, performs check\-in/check\-out, adds extra services to bills, and handles room assignments within their assigned branch 
4
Housekeeper 
A branch staff member who receives and manages room cleaning tasks, inspects room amenities, and reports missing or damaged items 
5
Branch Manager 
A branch administrator who configures room types, services, amenity templates, and pricing, and monitors branch\-level operational dashboards 
6
Super Admin 
A system\-wide administrator with full read and intervention access across all branches, responsible for managing branches and assigning staff roles 
### <a id="_15rs7mxeuqcf"></a>
### <a id="_yqebjubmisz1"></a>
### <a id="_hefdkn78w9lp"></a>
__*Table III\.1*__*: Actors*
### <a id="_rf2m0jwtyw5q"></a>__2\.2 Use Cases__
### <a id="_jlm8tcxpi04j"></a>__2\.2\.1 Diagram__
__*Figure III\.2*__*:* User *Use Case diagram*
                                        __*Figure III\.3 *__* Guest Use case diagram*
__*Figure III\.4*__*: *Customer* Use case diagram*
__*Figure III\.5*__*:*Receptionist* Use Case diagram*
                                     __*Figure III\.6*__*:* Housekeeper* Use Case diagram*
                                 __*Figure III\.7:*__Branch Manager* Use Case diagram*
*                                                     *__*Figure III\.8*__*:* Super Admin *Use Case diagram*
### <a id="_hzfpb9uea16r"></a>__2\.2\.2 Descriptions__
[Figure ](https://docs.google.com/document/d/1DDuli0VTmQbUii5wbItkVfbrL2yOgHRSqDVQJc8W8Aw/edit#heading=h.vfr36oj0vfd6)III\.8 Describe the functions present in the system and describe the roles used for each function\.
ID
Use Case
Actor
Description
UC\-01
Register
Customer
Register account, receive email OTP, activate account\.
UC\-02
Verify Email \(OTP\)
Customer
Verify OTP, activate account; lock 15 mins after 5 failures\.
UC\-03
Login
Customer, Receptionist, Housekeeper, Branch Manager, Super Admin
Login with email/password and receive JWT tokens\.
UC\-04
Login with Google OAuth2
Customer
Login via Google; auto\-create verified account if needed\.
UC\-05
Forgot Password
Customer
Request reset OTP and set new password\.
UC\-06
Resend OTP
Customer
Resend OTP after 60\-second cooldown\.
UC\-07
Logout
Customer, Receptionist, Housekeeper, Branch Manager, Super Admin
Logout and invalidate session/token\.
UC\-08
View Profile
Customer, Receptionist, Housekeeper, Branch Manager, Super Admin
View personal profile information\.
UC\-09
Edit Profile
Customer, Receptionist, Housekeeper, Branch Manager, Super Admin
Update name and phone number\.
UC\-10
Change Password
Customer, Receptionist, Housekeeper, Branch Manager, Super Admin
Change password after verifying old password\.
UC\-11
View Homepage
Guest
Browse hotel homepage information\.
UC\-12
View Hotel Detail
Guest
View branch details and amenities\.
UC\-13
View List Rooms
Guest
View active room types\.
UC\-14
View Room Detail
Guest
View detailed room information\.
UC\-15
Search Rooms
Guest
Search available rooms by dates and guests\.
UC\-16
View Customer Review
Guest
View customer reviews\.
UC\-17
Booking
Customer
Create booking and calculate deposit\.
UC\-18
Payment \(Deposit\)
Customer
Pay deposit and confirm booking\.
UC\-19
View Booking History
Customer
View all bookings and statuses\.
UC\-20
View Bill
Customer
View booking bill details\.
UC\-21
View Payment History
Customer
View booking payment records\.
UC\-22
Rating
Customer
Rate completed stay\.
UC\-23
Feedback
Customer
Submit stay feedback\.
UC\-24
React Feedbacks
Customer
Like/helpful reactions on feedback\.
UC\-25
Update Feedbacks
Customer
Edit submitted feedback\.
UC\-26
View Room List
Receptionist
View room statuses in branch\.
UC\-27
View Booking List
Receptionist
View and filter bookings\.
UC\-28
View Booking Detail
Receptionist
View booking details\.
UC\-29
Create Walk\-in Booking
Receptionist
Create booking for walk\-in guest\.
UC\-30
Check\-in
Receptionist
Check guest in and assign room\.
UC\-31
Check\-out
Receptionist
Finalize bill and check guest out\.
UC\-32
Add Extra Service to Bill
Receptionist
Add services to booking bill\.
UC\-33
Tick Missing Amenity
Receptionist/Housekeeper
Record missing amenities\.
UC\-34
View Bill \(Tab Bill\)
Receptionist
View bill summary\.
UC\-35
Cancel Booking
Receptionist
Cancel booking before check\-in\.
UC\-36
Mark No\-show
Receptionist
Mark absent guest and retain deposit\.
UC\-37
Room Transfer
Receptionist
Transfer booking to another room\.
UC\-38
Update Booking
Receptionist
Update guest count or notes\.
UC\-39
View Room Schedule
Receptionist
View room Gantt schedule\.
UC\-40
View Room Timeline
Receptionist
View room status timeline\.
UC\-41
View Transaction List
Receptionist
View branch transactions\.
UC\-42
View Transaction Detail
Receptionist
View transaction details\.
UC\-43
View Booking History
Receptionist
View historical bookings\.
UC\-44
View Task List
Housekeeper
View housekeeping tasks\.
UC\-45
View Task Detail
Housekeeper
View task details\.
UC\-46
Filter Task
Housekeeper
Filter tasks by status\.
UC\-47
Claim Task
Housekeeper
Claim unassigned task\.
UC\-48
Start Task
Housekeeper
Start housekeeping task\.
UC\-49
Check Amenities
Housekeeper
Review room amenities\.
UC\-50
Tick Missing Amenity & Quantity
Housekeeper
Report missing items and quantity\.
UC\-51
Save Amenity Report
Housekeeper
Save amenity inspection report\.
UC\-52
Report Room Issue
Housekeeper
Report room problems\.
UC\-53
Mark Room as Maintenance
Housekeeper/Manager
Set room to maintenance status\.
UC\-54
Complete Task
Housekeeper
Complete task and release room\.
UC\-55
View Completed Task History
Housekeeper
View completed tasks\.
UC\-56
View Branch Dashboard
Branch Manager
View branch KPIs and metrics\.
UC\-57
Configure Room Types
Branch Manager
Manage room types\.
UC\-58
Create Room Type
Branch Manager
Create room type\.
UC\-59
Update Room Type
Branch Manager
Update room type\.
UC\-60
Configure Room List
Branch Manager
Manage room inventory\.
UC\-61
Create Room
Branch Manager
Create physical room\.
UC\-62
Update Room
Branch Manager
Update room details\.
UC\-63
Configure Room Amenities
Branch Manager
Manage room amenities\.
UC\-64
Create New Room Amenity
Branch Manager
Add amenity template\.
UC\-65
Update Room Amenity
Branch Manager
Update amenity template\.
UC\-66
Configure Extra Services
Branch Manager
Manage extra services\.
UC\-67
Create New Extra Service
Branch Manager
Create extra service\.
UC\-68
Update Extra Service
Branch Manager
Update extra service\.
UC\-69
Monitor Housekeeping Tasks
Branch Manager
Monitor housekeeping workload\.
UC\-70
Review Room Issue Reports
Branch Manager
Review reported room issues\.
UC\-71
Manage Branches
Super Admin
Manage hotel branches\.
UC\-72
Create/Update Branch
Super Admin
Create or update branch\.
UC\-73
Deactivate Branch
Super Admin
Deactivate branch\.
UC\-74
Manage Users
Super Admin
Manage system users\.
UC\-75
Create Staff Account
Super Admin
Create staff account\.
UC\-76
Change User Role
Super Admin
Change user role\.
UC\-77
Assign Staff to Branch
Super Admin
Assign staff to branches\.
UC\-78
Deactivate Account
Super Admin
Deactivate user account\.
UC\-79
View Enterprise Dashboard
Super Admin
View enterprise\-wide dashboard\.
UC\-80
Revenue by Branch Report
Super Admin
Compare branch revenue\.
UC\-81
Occupancy Rate Report
Super Admin
View occupancy rate by branch\.
UC\-82
Housekeeping MISSED Rate Report
Super Admin
View housekeeping missed\-task KPI\.
__*Table III\.8*__*: Description*
## <a id="_5hqaez1qu8vc"></a>__3\. Functional Requirements__
### <a id="_5pnz8lm2rddv"></a>__3\.1 System Functional Overview__
#### <a id="_bg8mkmjdfgs3"></a>__*3\.1\.0 Business Flow*__
##### <a id="_qmfxsup51m6r"></a> 3\.1\.0\.1 Booking Business Flow
##### <a id="_9ac2bbj04qpr"></a>3\.1\.0\.3 Branch Manager Business Flow
##### <a id="_k89q4gmy8hh2"></a>
##### <a id="_kfq5qngqfdgw"></a>3\.1\.0\.4 Recipient and housekeeper Business Flow
#### __*3\.1\.1 Screens Flow*__
3\.1\.1\.1 Overview
3\.1\.1\.2 Guest Flow
3\.1\.1\.3\. Customer Flow
3\.1\.1\.4 Housekeeper Flow
##### <a id="_syd79eo1tyi8"></a>
##### <a id="_8awmipru2h13"></a>
3\.1\.1\.5 Receptionist Flow
3\.1\.1\.6 Branch Manager Flow
3\.1\.1\.7 Super Admin Flow
#### __*3\.1\.2 Screen Descriptions*__
__\#__
__Screen Name__
__Role__
__Description__
1
Home Page
Guest / All
The home page displays hotel information, the list of branches, and recommended rooms\. It can be accessed without logging in\.
2
Hotel Detail
Guest / All
Displays detailed information about a hotel branch, including its description, address, images, amenities, and reviews\.
3
Room List
Guest / All
Shows the list of active room types in the branch, with search and filtering by date and number of guests\.
4
Room Detail
Guest / All
Displays complete room information, including an image carousel, amenities, price, and policies\.
5
View Feedback
Guest / All
Allows users to view ratings and comments from customers who have stayed in the room or branch\.
6
Sign up Page
Guest
Allows a guest to register a new Customer account using an email and password, with OTP verification sent via email\.
7
Sign in Page
All roles
Allows users to sign in using email/password or Google OAuth2\. Each role is redirected to its corresponding welcome screen\.
8
Forgot Password Page
All roles
Allows users to request a password reset using an OTP sent to the registered email address\.
9
Profile Page
All
Displays the personal information of the logged\-in account, including full name, email, phone number, and avatar\.
10
Edit Profile
All
Allows users to update their full name and phone number\.
11
Change Password
All
Allows users to change their password after verifying the current password\.
12
Booking
Customer
Allows customers to create an online booking by selecting a room, check\-in/check\-out dates, entering guest information, and confirming the booking\.
13
Payment
Customer
Allows customers to pay the deposit through PayOS/VietQR\. The booking is automatically confirmed after a successful transaction\.
14
View Booking History
Customer / Receptionist
Displays the customer's booking history with the current status of each booking\.
15
Welcome Housekeeper
Housekeeper
Welcome screen displayed after login, providing navigation to Housekeeper functions\.
16
View Housekeeping List
Housekeeper
Displays the list of assigned or unclaimed housekeeping tasks, with filtering by status\.
17
Housekeeper Task Detail
Housekeeper
Displays details of a housekeeping task, including room, time, status, and the list of amenities to be checked\.
18
Check Amenities \(Tab device\)
Housekeeper
Tab used to check room amenities during a task, allowing missing or damaged items to be marked with quantities\.
19
Report Issue
Housekeeper
Allows the housekeeper to report room issues such as damage or technical problems\. The system automatically changes the room status to Maintenance\.
20
View Task History
Housekeeper
Displays the history of tasks completed by the Housekeeper\.
21
Welcome Receptionist
Receptionist
Welcome screen displayed after login, providing navigation to Receptionist functions\.
22
Walk\-in Booking
Receptionist
Allows the receptionist to create a walk\-in booking at the front desk for a guest, requiring a valid CCCD/CMND ID\.
23
View Booking List
Receptionist
Displays all bookings of the branch, with support for status filtering and search\.
24
View Booking Detail
Receptionist
Displays full booking details, including customer information, room, time, invoice, and status history\.
25
Transfer Room
Receptionist
Allows the receptionist to transfer an in\-house booking to another room within the same branch\.
26
Update Booking
Receptionist
Allows the receptionist to update booking information, such as the number of guests and notes\.
27
View Transaction List
Receptionist
Displays the list of payment transactions of the branch\.
28
View Transaction Detail
Receptionist
Displays transaction details, including amount, payment method, status, and time\.
29
View Room Schedule
Receptionist
Displays a Gantt\-style room booking schedule, showing room availability by date\.
30
View Room Timeline
Receptionist
Displays the real\-time status timeline of each room\.
31
View Booking History \(Receptionist\)
Receptionist
Displays the history of all past bookings of the branch\.
32
Welcome Branch Manager
Branch Manager
Welcome screen displayed after login, providing navigation to branch management functions\.
33
View Room Type List
Branch Manager
Displays the list of room types in the branch with overview information\.
34
View Room Type Detail
Branch Manager
Displays details of a room type, including capacity, area, bed type, description, and base price\.
35
Create new Room Type
Branch Manager
Allows the Branch Manager to create a new room type for the branch\.
36
Update Room Type
Branch Manager
Allows the Branch Manager to edit information of an existing room type\.
37
View Room List
Branch Manager / Receptionist
Displays the list of all physical rooms in the branch and their current statuses\.
38
View Room Detail
Branch Manager / Receptionist
Displays room details, including room number, floor, status, and the list of available amenities\.
39
Create new Room
Branch Manager
Allows the Branch Manager to create a new physical room linked to a room type and branch\.
40
Update Room
Branch Manager
Allows the Branch Manager to update room information, such as room number, floor, and status\.
41
View Room Amenities List
Branch Manager
Displays the list of amenity templates tracked by the branch\.
42
View Room Amenities Detail
Branch Manager
Displays details of an amenity template, including name, description, and charge applied when it is missing\.
43
Create new Room Amenities
Branch Manager
Allows the Branch Manager to create a new amenity template for the branch\.
44
Update Room Amenities
Branch Manager
Allows the Branch Manager to update information of an existing amenity template\.
45
View Extra Services
Branch Manager
Displays the list of extra services offered by the branch, such as massage, food and beverage, and late check\-out extension\.
46
View Extra Services Detail
Branch Manager
Displays details of an extra service, including name, description, price, and status\.
47
Create new Extra Service
Branch Manager
Allows the Branch Manager to create a new extra service for the branch\.
48
Update Extra Services
Branch Manager
Allows the Branch Manager to update information of an existing extra service\.
49
View Housekeeper Task List \(Manager\)
Branch Manager
Displays all housekeeping tasks of the branch, allowing the manager to monitor progress and assignments\.
50
Update Housekeeper Assignment
Branch Manager
Allows the Branch Manager to update task assignments for Housekeepers\.
51
View Room Issue Report List
Branch Manager
Displays the list of room issue reports submitted by Housekeepers\.
52
View Room Issue Report Detail
Branch Manager
Displays details of a room issue report, including room, description, images, and processing status\.
53
Mark Room as Maintain
Branch Manager
Allows the room to be marked as Maintenance to temporarily stop new bookings\.
54
View Branch Dashboard
Branch Manager
Displays branch KPI dashboard data, including occupancy rate, revenue, and Housekeeper missed\-task rate\.
55
Welcome Super Admin
Super Admin
Welcome screen displayed after login, providing navigation to system\-wide administration functions\.
56
View Branch List
Super Admin
Displays the list of all branches in the system with their operating statuses\.
57
Create new Branch
Super Admin
Allows the Super Admin to create a new branch with information such as name, code, address, GPS coordinates, hotline, and deposit rate\.
58
Update Branch
Super Admin
Allows the Super Admin to update information of an existing branch\.
59
Deactivate Branch
Super Admin
Allows the Super Admin to deactivate a branch and hide it from customers\.
60
View User List
Super Admin
Displays the list of all user accounts in the system, with filtering by role and status\.
61
Create User Account
Super Admin
Allows the Super Admin to create new staff accounts, including Receptionist, Housekeeper, and Branch Manager accounts\.
62
Change Role User
Super Admin
Allows the Super Admin to change the role of an account in the system\.
63
Deactivate Account
Super Admin
Allows the Super Admin to deactivate a user account\.
64
Branch Assignment
Super Admin
Allows the Super Admin to assign staff to a specific branch\.
65
View Enterprise Dashboard
Super Admin
Displays an enterprise\-level dashboard summarizing revenue by branch, occupancy rate, and Housekeeper KPIs\.
66
View Branch Dashboard \(SA\)
Super Admin
Allows the Super Admin to view branch\-level dashboards without branch restrictions\.
*Table\.III\.11: Screen description*
#### *3\.1\.3 Screen Authorization*
__*Table III\.12*__*: Screen authorization*
__\#__
__Screen__
__Guest__
__Customer__
__Receptionist__
__Housekeeper__
__Branch Manager__
__Super Admin__
1
Home Page
x
x
x
x
x
x
2
Hotel Detail
x
x
x
x
x
x
3
Room List
x
x
x
x
x
x
4
Room Detail
x
x
x
x
x
x
5
View Feedback
x
x
x
x
x
x
6
Sign up Page
x
x
7
Sign in Page
x
x
x
x
x
x
8
Forgot Password Page
x
x
x
x
x
x
9
Profile Page
x
x
x
x
x
10
Edit Profile
x
x
x
x
x
11
Change Password
x
x
x
x
x
12
Booking
x
13
Payment
x
14
View Booking History
x
x
15
Welcome Housekeeper
x
16
View Housekeeping List
x
17
Housekeeper Task Detail
x
18
Check Amenities \(Tab device\)
x
19
Report Issue
x
20
View Task History
x
21
Welcome Receptionist
x
22
Walk\-in Booking
x
23
View Booking List
x
24
View Booking Detail
x
25
Transfer Room
x
26
Update Booking
x
27
View Transaction List
x
28
View Transaction Detail
x
29
View Room Schedule
x
30
View Room Timeline
x
31
View Booking History \(Receptionist\)
x
32
Welcome Branch Manager
x
33
View Room Type List
x
34
View Room Type Detail
x
35
Create new Room Type
x
36
Update Room Type
x
37
View Room List
x
x
38
View Room Detail
x
x
39
Create new Room
x
40
Update Room
x
41
View Room Amenities List
x
42
View Room Amenities Detail
x
43
Create new Room Amenities
x
44
Update Room Amenities
x
45
View Extra Services
x
46
View Extra Services Detail
x
47
Create new Extra Service
x
48
Update Extra Services
x
49
View Housekeeper Task List \(Mgr\)
x
50
Update Housekeeper Assignment
x
51
View Room Issue Report List
x
52
View Room Issue Report Detail
x
53
Mark Room as Maintain
x
54
View Branch Dashboard
x
x
55
Welcome Super Admin
x
56
View Branch List
x
57
Create new Branch
x
58
Update Branch
x
59
Deactivate Branch
x
60
View User List
x
61
Create User Account
x
62
Change Role User
x
63
Deactivate Account
x
64
Branch Assignment
x
65
View Enterprise Dashboard
x
66
View Branch Dashboard \(SA\)
x
#### __*3\.1\.4 Non\-Screen Functions*__
Table III\.13: Shows the screen authorizations of the system
__\#__
__Feature__
__System Function__
__Description__
1
User management
Logout
User logout to system
2
Management
Search
User search for item
3
Notification
Send notification
Send notification to user and admin relate to booking process
__*Table III\.13*__*: Non\-Screen functions*
#### <a id="_si00aduxr42s"></a>
#### <a id="_s0c9sjdstbjl"></a>__*3\.1\.5 In/Out of scope *__
Table III\.14: Shows the goals set to upgrade the system after completing the functions outlined above\.
__\#__
__In of Scope__
__Out of Scope__
1
Manage Booking Schedule
HR Management
2
Manage Users
Financial Management
3
Statistics Reports
Inventory Management
4
Manage Bookings Room,  Fields, \.\.
Mobile Application Development
5
Integration with Other Systems,\.\.\.
__*Table III\.14*__*: In/Out of scope*
### __3\.2 Feature description__
#### <a id="_pj9gne16s33w"></a>__*3\.2\.1\. Login*__
Table III\.15: Shows the Login feature description
__USE CASE\-01__
__Use\-case No\.__
UC01
__Use\-case Version__
1\.0
__Use\-case Name__
Login
__Author__
ΓÇª
__Date__
07/09/2024
__Priority__
High
__Actor__
User, Admin
__Summary__
User login to use actor features on the system
__Goal__
Allow guest become user/admin of system
__Triggers__
Guest click on button ΓÇ£─É─âng nhß║¡pΓÇ£ on navigation bar
__Preconditions__
User not login and have FPT email
__Post Conditions__
User join system with their role and use all feature with permission
__Main Success Scenario__
__Step__
__Actor Event__
__System response__
1
User click button ΓÇ£─É─âng nhß║¡pΓÇ¥ in navigation bar
Redirect to google authentication service
2
 Login to google with FPT email
Allow user join on the system and log the message
__Alternative Scenario__
__Step__
__Action__
__Use case__
__Exceptions__
__Exception code__
__Message__
__Caught__
403
Forbidden
User do not have permission on this page
__Business Rules__
__Code__
__Rule__
BR\-01
In first time login, account detail and userΓÇÖs detail is added into database
#### <a id="_7g3plnfr4xlb"></a>
__*Table III\.15*__*: Login feature*
#### <a id="_xd9k5xejmx56"></a>__*3\.2\.2\. Logout*__
Table III\.16: Shows the Logout feature description
__USE CASE\-02__
__Use\-case No\.__
UC02
__Use\-case Version__
1\.0
__Use\-case Name__
Logout
__Author__
ΓÇª
__Date__
07/09/2024
__Priority__
High
__Actor__
User, Admin
__Summary__
User logout system and back to guest's role
__Goal__
Set role user to guest
__Triggers__
User click on button ΓÇ£─É─âng xuß║ÑtΓÇ£ 
__Preconditions__
User already logged in the system
__Post Conditions__
User become guest
__Main Success Scenario__
__Step__
__Actor Event__
__System response__
1
User click button ΓÇ£─É─âng xuß║ÑtΓÇ¥ in 
2
Logout of the system
__Alternative Scenario__
__Step__
__Action__
__Use case__
__Exceptions__
__Exception code__
__Message__
__Caught__
N/A
__Business Rules__
__Code__
__Rule__
N/A
__*Table III\.16*__*: Logout feature*
#### <a id="_tc0qsspf90d7"></a>__*3\.2\.3\. View Profile*__
Table III\.17: Shows the view profile feature description
__USE CASE\-03__
__Use\-case No\.__
UC03
__Use\-case Version__
1\.0
__Use\-case Name__
View Profile
__Author__
ΓÇª
__Date__
09/09/2024
__Priority__
High
__Actor__
User, Admin
__Summary__
Actor can view their information in this page
__Goal__
Display userΓÇÖs profile successfully
__Triggers__
Click in ΓÇ£Hß╗ô s╞í cß╗ºa t├┤iΓÇ¥ in avatar icon on navbar
__Preconditions__
User has been login 
__Post Conditions__
Display all details of user 
__Main Success Scenario__
__Step__
__Actor Event__
__System response__
1
User click in ΓÇ£Hß╗ô s╞í cß╗ºa t├┤iΓÇ¥ in avatar icon on navbar
 Redirect to user profile page
2
Display userΓÇÖs detail
__Alternative Scenario__
__\#__
__Action__
__Use case__
__Exceptions__
__Exception code__
__Message__
__Caught__
401
Unauthorised
User is not login yet
__Business Rules__
__Code__
__Rule__
N/A
__*Table III\.17*__*: View profile feature*
#### <a id="_ncbsskr6aier"></a>__*3\.2\.4\. Edit Profile*__
Table III\.18: Shows the edit profile feature description
__USE CASE\-04__
__Use\-case No\.__
UC04
__Use\-case Version__
1\.0
__Use\-case Name__
Edit Profile
__Author__
ΓÇª
__Date__
09/09/2024
__Priority__
Medium
__Actor__
User, Admin
__Summary__
Actor can update their information in this page
__Goal__
Update userΓÇÖs profile successfully
__Triggers__
Fill in field
__Preconditions__
Profile screen is available
__Post Conditions__
New information is update into database
__Main Success Scenario__
__Step__
__Actor Event__
__System response__
1
Fill your info in field
2
Click in button ΓÇ£L╞░uΓÇ¥
Validate userΓÇÖs input
3
Save to database and log message
__Alternative Scenario__
__\#__
__Action__
__System response__
3
Update new user detail
User detail is invalid, log message
4
Click in button ΓÇ£Hß╗ºyΓÇ¥
Clear inputted data
__Exceptions__
__Exception code__
__Message__
__Caught__
401
Unauthorised
User is not login yet
__Business Rules__
__Code__
__Rule__
BR\-02
UserΓÇÖs detail must be valid
__*Table III\.18*__* Edit profile feature*
#### <a id="_dbz5bu33hu3h"></a>__*3\.2\.5\. View facility list*__
Table III\.19: Shows the view facility feature description
__USE CASE\-05__
__Use\-case No\.__
UC05
__Use\-case Version__
1\.0
__Use\-case Name__
View facility list
__Author__
Mß║ính \+ Kiß╗çt
__Date__
15/09/2024
__Priority__
High
__Actor__
Guest, User, Admin
__Summary__
User view list of facilities
__Goal__
Display all of facilities with pagination, search and filter
__Triggers__
Search or click in any category in Homepage
__Preconditions__
Facilities List is available
__Post Conditions__
All available facilities are displayed 
__Main Success Scenario__
__Step__
__Actor Event__
__System response__
1
Search or click in any category in Homepage
Navigate to Facilities List and d├¡splay all of available facilities which matches with condition
2
 User search / filter
Display facilities according to keyword or filter
__Alternative Scenario__
__\#__
__Action__
__Use case__
__Exceptions__
__Exception code__
__Message__
__Caught__
N/A
__Business Rules__
__Code__
__Rule__
N/A
__*Table III\.19*__*: View facility feature*
#### <a id="_rz6cu36fctg8"></a>__*3\.2\.6\. View facilities detail*__
Table III\.20: Shows the view facilities detail feature description
__USE CASE\-06__
__Use\-case No\.__
UC06
__Use\-case Version__
1\.0
__Use\-case Name__
View facilities detail
__Author__
Mß║ính \+ Kiß╗çt
__Date__
15/09/2024
__Priority__
High
__Actor__
Guest, User, Admin
__Summary__
User view detail of a facility
__Goal__
Display all details of a specific facility
__Triggers__
User click on a specific facility
__Preconditions__
Facility is available
__Post Conditions__
FacilityΓÇÖs detail is displayed successfully
__Main Success Scenario__
__Step__
__Actor Event__
__System response__
1
User click in a specific facility
Navigate to Facilities Detail and d├¡splay all detail of facility
__Alternative Scenario__
__\#__
__Action__
__Use case__
__Exceptions__
__Exception code__
__Message__
__Caught__
N/A
__Business Rules__
__Code__
__Rule__
N/A
__*Table III\.20*__*: View facilities detail feature*
#### <a id="_ogwl3brqyfro"></a>__*3\.2\.7\. Evaluate*__
Table III\.21: Shows the evaluate feature description
__USE CASE\-07__
__Use\-case No\.__
UC07
__Use\-case Version__
1\.0
__Use\-case Name__
Evaluate
__Author__
Mß║ính \+ Kiß╗çt
__Date__
20/09/2024
__Priority__
High
__Actor__
User, Admin
__Summary__
User can rating and comment for a facility
__Goal__
Get feedback from user
__Triggers__
Vote and enter comment
__Preconditions__
Facility detail page is available\. User used this facility before
__Post Conditions__
Comment and rating of user is saved into database
__Main Success Scenario__
__Step__
__Actor Event__
__System response__
1
Vote and enter comment
 Validate comment 
2
 Save to database and display user feedback
__Alternative Scenario__
__\#__
__Action__
__Use case__
__Exceptions__
__Exception code__
__Message__
__Caught__
403
Forbidden
User do not have permission on this page
__Business Rules__
__Code__
__Rule__
__*Table III\.21*__*: Evaluate feature*
#### <a id="_hme1auur2jhk"></a>__*3\.2\.8\. Create booking*__
Table III\.22: Shows the create booking feature description
__USE CASE\-08__
__Use\-case No\.__
UC08
__Use\-case Version__
1\.0
__Use\-case Name__
Create booking
__Author__
Mß║ính \+ Kiß╗çt
__Date__
25/09/2024
__Priority__
High
__Actor__
User, Admin
__Summary__
Actor can create booking request for a specific facilities
__Goal__
Request is send to Admin 
__Triggers__
Click ΓÇ£─Éß║╖t ph├▓ngΓÇ¥ and select slot 
__Preconditions__
Facility is available
__Post Conditions__
Booking request and notification is send to admin
__Main Success Scenario__
__Step__
__Actor Event__
__System response__
1
Click in ΓÇ£─Éß║╖t ph├▓ngΓÇ¥
2
Select a slot
3
Send notification and request to admin and log message
__Alternative Scenario__
__\#__
__Action__
__Use case__
Booking processing
UC12
__Exceptions__
__Exception code__
__Message__
__Caught__
401
Unauthorized
User is not login yet
403
Forbidden
User do not have permission on this page
__Business Rules__
__Code__
__Rule__
N/A
__*Table III\.22*__* Create booking feature*
#### <a id="_ewwc3rltay1s"></a>__*3\.2\.9\. View notification list*__
Table III\.23: Shows the view notification list feature description
__USE CASE\-09__
__Use\-case No\.__
UC09
__Use\-case Version__
1\.0
__Use\-case Name__
View notification list
__Author__
Mß║ính \+ Kiß╗çt
__Date__
30/09/2024
__Priority__
High
__Actor__
User, Admin
__Summary__
Actor can view all of notification
__Goal__
Show notification of booking for user and admin 
__Triggers__
Click bell icon in navbar
__Preconditions__
Notification list is available
__Post Conditions__
All of notifications are showed
__Main Success Scenario__
__Step__
__Actor Event__
__System response__
1
Click in bell icon
 Display all of notification
__Alternative Scenario__
__\#__
__Action__
__Use case__
__Exceptions__
__Exception code__
__Message__
__Caught__
401
Unauthorised
User is not login yet
403
Forbidden
User do not have permission on this page
__Business Rules__
__Code__
__Rule__
BR\-03
Notification of user and admin have to mapping
__*Table III\.23*__*: View notification feature*
#### <a id="_m4jsx0r2u5p3"></a>__*3\.2\.10\. Chat*__
Table III\.24 : Shows the chat feature description
__USE CASE\-10__
__Use\-case No\.__
UC10
__Use\-case Version__
1\.0
__Use\-case Name__
Chat
__Author__
Mß║ính \+ Kiß╗çt
__Date__
02/10/2024
__Priority__
High
__Actor__
User, Admin
__Summary__
Allow User and Admin chat with each others 
__Goal__
User can send message to Admin and Admin can reply User
__Triggers__
Click message icon
__Preconditions__
Chat page is available
__Post Conditions__
Message is sent
__Main Success Scenario__
__Step__
__Actor Event__
__System response__
1
User click in message icon
Open chat box
2
User Enter message and send
 Send message to Admin
3
Display message in chat screen of admin
4
Admin reply message
Send message to User
5
Display message in user chat box
__Alternative Scenario__
__\#__
__Action__
__Use case__
__Exceptions__
__Exception code__
__Message__
__Caught__
401
Unauthorized
User is not login yet
403
Forbidden
User do not have permission on this page
__Business Rules__
__Code__
__Rule__
N/A
__*Table III\.24*__*: Chat feature*
#### <a id="_j4pgfxovi0e7"></a>__*3\.2\.11\. View booking list*__
Table III\.25: Shows the view booking list feature description
__USE CASE\-11__
__Use\-case No\.__
UC11
__Use\-case Version__
1\.0
__Use\-case Name__
View booking list
__Author__
To├án \+ An
__Date__
03/10/2024
__Priority__
High
__Actor__
Admin
__Summary__
Allow admin view all of booking request
__Goal__
Manage booking request
__Triggers__
Click in ΓÇ£Duyß╗çt y├¬u cß║ºu ─æß║╖t s├ón, ph├▓ng hß╗ìcΓÇ¥
__Preconditions__
User has been login as role Admin
__Post Conditions__
Display all booking request
__Main Success Scenario__
__Step__
__Actor Event__
__System response__
1
Click in ΓÇ£Duyß╗çt y├¬u cß║ºu ─æß║╖t s├ón, ph├▓ng hß╗ìcΓÇ¥
 Navigate to Booking request list
2
 Display all of booking request
__Alternative Scenario__
__\#__
__Action__
__Use case__
Booking processing
UC12
__Exceptions__
__Exception code__
__Message__
__Caught__
401
Unauthorised
User is not login yet
403
Forbidden
User do not have permission on this page
__Business Rules__
__Code__
__Rule__
N/A
__*Table III\.25*__*: View booking feature*
#### <a id="_n29zi3jby7d9"></a>__*3\.2\.12\. Booking processing*__
Table III\.26: Shows the booking processing feature description
__USE CASE\-12__
__Use\-case No\.__
UC12
__Use\-case Version__
1\.0
__Use\-case Name__
Booking processing
__Author__
To├án \+ An
__Date__
05/10/2024
__Priority__
High
__Actor__
Admin
__Summary__
Execute booking request
__Goal__
Response request from user
__Triggers__
Click link ΓÇ£Chß║Ñp nhß║¡nΓÇ¥ or ΓÇ£Tß╗½ chß╗æiΓÇ¥
__Preconditions__
User has been login as role Admin
__Post Conditions__
Update booking status and send notification to user
__Main Success Scenario__
__Step__
__Actor Event__
__System response__
1
Click in ΓÇ£Chß║Ñp nhß║¡nΓÇ¥
 Change booking status
2
 Send notification to user
__Alternative Scenario__
__\#__
__Action__
__System Response__
1
Click in ΓÇ£Tß╗½ chß╗æiΓÇ¥
2
Enter ΓÇ£L├╜ do tß╗½ chß╗æiΓÇ¥
Change booking status
Send notification to user
__Exceptions__
__Exception code__
__Message__
__Caught__
401
Unauthorised
User is not login yet
403
Forbidden
User do not have permission on this page
__Business Rules__
__Code__
__Rule__
__*Table III\.26*__*: Booking processing feature*
#### <a id="_92wlhisvd7xr"></a>__*3\.2\.13\. Block/Unblock Account*__
Table III\.27: Shows the Block/Unblock account feature description
__USE CASE\-13__
__Use\-case No\.__
UC13
__Use\-case Version__
1\.0
__Use\-case Name__
Block/Unblock Account
__Author__
To├án \+ An
__Date__
07/10/2024
__Priority__
Medium
__Actor__
Admin
__Summary__
Allow admin block/unblock user account
__Goal__
Block/Unblock user from the system
__Triggers__
Click link ΓÇ£ActiveΓÇ¥ or ΓÇ£InactiveΓÇ¥
__Preconditions__
Account List page is available 
__Post Conditions__
Change account status
__Main Success Scenario__
__Step__
__Actor Event__
__System response__
1
Click ΓÇ£InactiveΓÇ¥
 Change account status and block account
__Alternative Scenario__
__\#__
__Action__
__Use case__
1
Click ΓÇ£ActiveΓÇ¥
Change account status and unblock account
__Exceptions__
__Exception code__
__Message__
__Caught__
401
Unauthorised
User is not login yet
403
Forbidden
User do not have permission on this page
__Business Rules__
__Code__
__Rule__
__*Table III\.27*__*: Block/ Unblock feature*
#### <a id="_lrsvcdo56c1x"></a>__*3\.2\.14\. View Statistic*__
Table III\.28: Shows the view statistic feature description
__USE CASE\-14__
__Use\-case No\.__
UC14
__Use\-case Version__
1\.0
__Use\-case Name__
View statistic
__Author__
To├án \+ An
__Date__
10/10/2024
__Priority__
High
__Actor__
Admin
__Summary__
Admin can view all statistic of the system
__Goal__
Show statistic by chart
__Triggers__
Click ΓÇ¥Thß╗æng k├¬ΓÇ¥ in sidebar of Dashboard
__Preconditions__
Dashboard is available
__Post Conditions__
Display statistic by chart
__Main Success Scenario__
__Step__
__Actor Event__
__System response__
1
Click in ΓÇ£Thß╗æng k├¬ΓÇ¥
 Display statistic by chart
2
Choose optional filter
 Display statistic mapping with filter
__Alternative Scenario__
__\#__
__Action__
__Use case__
__Exceptions__
__Exception code__
__Message__
__Caught__
401
Unauthorised
User is not login yet
403
Forbidden
User do not have permission on this page
__Business Rules__
__Code__
__Rule__
BR\-04
Statistic and chart have to mapping with database
##### <a id="_vdont4rgs57o"></a>
__*Table III\.28*__*: View statistic feature*
#### <a id="_jz5prmnbg0fb"></a>__*3\.2\.15\. Create Facility*__
Table III\.29: Shows the create facility feature description
__USE CASE\-15__
__Use\-case No\.__
UC15
__Use\-case Version__
1\.0
__Use\-case Name__
Create Facility
__Author__
An\+Mß║ính
__Date__
13/10/2024
__Priority__
High
__Actor__
Admin
__Summary__
Allow admin create a new facility
__Goal__
A new facility is created
__Triggers__
Click in \+ button in facilities list screen
__Preconditions__
Facility Adding screen is available
__Post Conditions__
A new facility is created and save to DB
__Main Success Scenario__
__Step__
__Actor Event__
__System response__
1
Click in \+ button in facilities list screen
 Display Facility Adding screen 
2
Fill all the field
3
 Select ΓÇ£Th├¬mΓÇ¥
Validate inputted data
4
Create new facility and log message
__Alternative Scenario__
__\#__
__Action__
__System response__
3
 Select ΓÇ£Th├¬mΓÇ¥
Validate inputted data
4
Return error and require input data again
5
Re\-input data and select ΓÇ£Th├¬mΓÇ¥
Validate inputted data
__Exceptions__
__Exception code__
__Message__
__Caught__
401
Unauthorised
User is not login yet
403
Forbidden
User do not have permission on this page
__Business Rules__
__Code__
__Rule__
BR\-05
New facility canΓÇÖt be duplicate with existed facilities
__*Table III\.29*__*: Create facility feature*
#### <a id="_w3ya3vtlr8ol"></a>__*3\.2\.16\. Update Facility*__
Table III\.30: Shows the update facility feature description
__USE CASE\-16__
__Use\-case No\.__
UC16
__Use\-case Version__
1\.0
__Use\-case Name__
Update
__Author__
To├án \+ An
__Date__
15/10/2024
__Priority__
High
__Actor__
Admin
__Summary__
Allow admin update facilityΓÇÖs detail
__Goal__
FacilityΓÇÖs detail is updated and save to DB
__Triggers__
Click in ΓÇ£Cß║¡p nhß║¡tΓÇ¥ in Facilities List
__Preconditions__
Facility is available\. Logged in with role admin
__Post Conditions__
Facility's detail is updated and save in database
__Main Success Scenario__
__Step__
__Actor Event__
__System response__
1
Click in ΓÇ£Cß║¡p nhß║¡t
 Display facilityΓÇÖs detail
2
Enter new facilityΓÇÖs detail
3
 Click ΓÇ£Cß║¡p nhß║¡pΓÇ¥
Validate inputted data
4
Update new facilityΓÇÖs detail, save to database and log message
5
Save record of change into Logs
__Alternative Scenario__
__\#__
__Action__
__System Response__
3
Click ΓÇ£Hß╗ºyΓÇ¥
Back to facilities list
__Exceptions__
__Exception code__
__Message__
__Caught__
401
Unauthorised
User is not login yet
403
Forbidden
User do not have permission on this page
__Business Rules__
__Code__
__Rule__
BR\-06
New facilityΓÇÖs detail canΓÇÖt duplicate with other facilities
__*Table III\.30*__*: Update facility feature*
#### <a id="_pl25ebstvigu"></a>__*3\.2\.17\. View facility updating history*__
Table III\.31: Shows the view facility updating history feature description
__USE CASE\-17__
__Use\-case No\.__
UC17
__Use\-case Version__
1\.0
__Use\-case Name__
View facility updating history
__Author__
To├án \+ An
__Date__
20/10/2024
__Priority__
High
__Actor__
Admin
__Summary__
Allow admin can view the change of facility
__Goal__
Display record of change
__Triggers__
Click in ΓÇ£XemΓÇ¥ in column ΓÇ£Lß╗ïch sß╗¡ cß║¡p nhß║¡tΓÇ¥
__Preconditions__
User has been login as role Admin
__Post Conditions__
Display all the change of facilities
__Main Success Scenario__
__Step__
__Actor Event__
__System response__
1
Click in ΓÇ£XemΓÇ¥
 Display record of change
__Alternative Scenario__
__\#__
__Action__
__Use case__
__Exceptions__
__Exception code__
__Message__
__Caught__
401
Unauthorised
User is not login yet
403
Forbidden
User do not have permission on this page
__Business Rules__
__Code__
__Rule__
N/A
__*Table III\.31*__*: View facility feature*
#### <a id="_5ylomxgqxk95"></a>__*3\.2\.18\. Active/Inactive facility*__
Table III\.32: Shows the active/inactive feature description
__USE CASE\-18__
__Use\-case No\.__
UC18
__Use\-case Version__
1\.0
__Use\-case Name__
Active/Inactive facility
__Author__
To├án \+ An
__Date__
23/10/2024
__Priority__
High
__Actor__
Admin
__Summary__
Active/Inactive a specific category
__Goal__
Change status of facilities and save into database
__Triggers__
Click button ΓÇ£ActiveΓÇ¥ or ΓÇ£InactiveΓÇ¥
__Preconditions__
Facility is available\. Logged in with role admin
__Post Conditions__
FacilityΓÇÖs status is change
__Main Success Scenario__
__Step__
__Actor Event__
__System response__
1
Click ΓÇ£ActiveΓÇ¥
 Show a notice
2
Admin confirm
 Change status of facility into inactive
__Alternative Scenario__
__\#__
__Action__
__System Response__
2
Admin decline
Back to facilities list
__Exceptions__
__Exception code__
__Message__
__Caught__
401
Unauthorised
User is not login yet
403
Forbidden
User do not have permission on this page
__Business Rules__
__Code__
__Rule__
BR\-07
When inactive a facilities, all the pending request will be decline with reason ΓÇ£C╞í sß╗ƒ n├áy kh├┤ng c├▓n khß║ú dß╗ÑngΓÇ¥ 
__*Table III\.32*__*: Active/Inactive facility feature*
#### <a id="_ibzdqj3yfif9"></a>__*3\.2\.19\. Create category*__
Table III\.33: Shows the create category feature description
__USE CASE\-19__
__Use\-case No\.__
UC19
__Use\-case Version__
1\.0
__Use\-case Name__
Create category
__Author__
To├án \+ An
__Date__
25/10/2024
__Priority__
High
__Actor__
Admin
__Summary__
Allow admin create a new category
__Goal__
A new category is created
__Triggers__
Click in \+ button in categories list screen
__Preconditions__
Category Adding screen is available
__Post Conditions__
A new category is created and save to DB
__Main Success Scenario__
__Step__
__Actor Event__
__System response__
1
Click in \+ button in categories list screen
 Display Category Adding screen 
2
Fill all the field
3
 Select ΓÇ£Th├¬mΓÇ¥
Validate inputted data
4
Create new category and log message
__Alternative Scenario__
__\#__
__Action__
__System Response__
3
 Select ΓÇ£Th├¬mΓÇ¥
Validate inputted data
4
Return error and require input data again
5
Re\-input data and select ΓÇ£Th├¬mΓÇ¥
Validate inputted data
__Exceptions__
__Exception code__
__Message__
__Caught__
401
Unauthorised
User is not login yet
403
Forbidden
User do not have permission on this page
__Business Rules__
__Code__
__Rule__
BR\-08
New category canΓÇÖt be duplicate with existed categories
__*Table III\.33*__*: Create category feature*
#### <a id="_pl169pogjew0"></a>__*3\.2\.20\. Update category*__
Table III\.34: Shows the update category feature description
__USE CASE\-20__
__Use\-case No\.__
UC20
__Use\-case Version__
1\.0
__Use\-case Name__
Update category
__Author__
To├án \+ An
__Date__
26/10/2024
__Priority__
High
__Actor__
Admin
__Summary__
Allow admin update categoryΓÇÖs detail
__Goal__
CategoryΓÇÖs detail is updated and save to DB
__Triggers__
Click in ΓÇ£Cß║¡p nhß║¡tΓÇ¥ in Category List
__Preconditions__
Category is available\. Logged in with role admin
__Post Conditions__
CategoryΓÇÖs detail is updated and save in database
__Main Success Scenario__
__Step__
__Actor Event__
__System response__
1
Click in ΓÇ£Cß║¡p nhß║¡t
 Display categoryΓÇÖs detail
2
Enter new facilityΓÇÖs detail
3
 Click ΓÇ£Cß║¡p nhß║¡pΓÇ¥
Validate inputted data
4
Update new categoryΓÇÖs detail, save to database and log message
5
Save record of change into Logs
__Alternative Scenario__
__\#__
__Action__
__System Response__
3
Click ΓÇ£Hß╗ºyΓÇ¥
Back to facilities list
__Exceptions__
__Exception code__
__Message__
__Caught__
401
Unauthorised
User is not login yet
403
Forbidden
User do not have permission on this page
__Business Rules__
__Code__
__Rule__
BR\-09
New facilityΓÇÖs detail canΓÇÖt duplicate with other facilities
__*Table III\.34*__*: Update category feature*
#### <a id="_1jh71gm0r3a3"></a>__*3\.2\.21\. View category updating history*__
Table III\.35: Shows the view category feature description
##### <a id="_7xz17upkh32v"></a>
__USE CASE\-21__
__Use\-case No\.__
UC21
__Use\-case Version__
1\.0
__Use\-case Name__
View category updating history
__Author__
To├án \+ An
__Date__
27/10/2024
__Priority__
High
__Actor__
Admin
__Summary__
Allow admin can view the change of category
__Goal__
Display record of change
__Triggers__
Click in ΓÇ£XemΓÇ¥ in column ΓÇ£Lß╗ïch sß╗¡ cß║¡p nhß║¡tΓÇ¥
__Preconditions__
User has been login as role Admin
__Post Conditions__
Display all the change of facilities
__Main Success Scenario__
__Step__
__Actor Event__
__System response__
1
Click in ΓÇ£XemΓÇ¥
 Display record of change
__Alternative Scenario__
__\#__
__Action__
__Use case__
__Exceptions__
__Exception code__
__Message__
__Caught__
401
Unauthorised
User is not login yet
403
Forbidden
User do not have permission on this page
__Business Rules__
__Code__
__Rule__
N/A
__*Table III\.35*__*: View category feature*
## <a id="_ambu7ab64fa5"></a>__4\. Non\-Functional Requirements__
### <a id="_bdvobnjcp9z6"></a>__4\.1 External Interfaces__
#### <a id="_rda5f6lp3ul7"></a>__*4\.1\.1\. User interfaces*__
- UI\-01: The website shall display correctly without glitches on popular browsers including Chrome, Firefox, Safari and Edge\.
- UI\-02: FMS screen displays shall conform to the Process Impact Internet Application User Interface Standard\.
- UI\-03: Audit form interface: An interface that enables auditors to input data related to safety inspections, including checklist items, observations, photographs, and comments\.
- UI\-04: The system should responsively in mobile device
#### <a id="_kh1i7qvzh1b2"></a>__*4\.2\.2 Security interfaces*__
- SI\-01: Access control interface: An interface that enforces role\-based access control, defining user permissions and restrictions based on their roles within the system\.
### <a id="_jjaj2qfhz2dz"></a>__4\.2 Quality Attributes__
#### <a id="_tagg1sg7be47"></a>__*4\.2\.1 Usability *__
- US\-01: The system will be designed with simple and friendly user interfaces\.
- US\-02: Users shall become familiar and productive at main operations after a short time using the application\.
- US\-03: Clear and informative error messages should be provided to guide users in resolving any issues or mistakes encountered during system use\.
#### <a id="_67h223ficsd7"></a>__*4\.2\.2 Reliability *__
- RE\-01: The system should be highly available, ensuring minimal downtime to support continuous access and use by auditors and stakeholders\.
- RE\-02: All data entered by the user is validated before sending it to the server
#### <a id="_tvpzhkak1vef"></a>__*4\.2\.3 Performance*__
- PE\-01: The system should respond promptly to user actions, ensuring minimal delay when loading pages, saving data, or generating reports\.
- PE\-02: The system should be able to handle an increasing number of concurrent users and data volumes without significant degradation in performance\.
- PE\-03: The system should utilize system resources, such as memory and processing power, efficiently to deliver optimal performance\.
#### __*4\.2\.4 Security*__
- SE\-01: The system should ensure that sensitive data, such as audit reports and user information, is protected from unauthorised access or disclosure\.
- SE\-02: The system should prevent unauthorized modification or tampering of data, ensuring that audit records remain accurate and reliable\.
- SE\-03: Robust mechanisms should be implemented to verify the identity of users and grant appropriate access privileges based on their roles and responsibilities\.
## __5\. Requirement Appendix__
### <a id="_t7zupyi3hh6n"></a>__5\.1 Business Rules__
Table III\.36: Description rule definition of the system
__*ID*__
__*Rule Definition*__
BR\-01
Each account can only be assigned one role at a time: Super Admin, Branch Manager, Receptionist, Housekeeper, or Customer\.
BR\-02
The username and email of each account must be unique across the entire system\.
BR\-03
Passwords must be stored as a secure hash using the bcrypt algorithm\.
BR\-04
Upon successful registration, the system generates an email verification token and sends a confirmation email to the user\.
BR\-05
Accounts that have not verified their email are not permitted to log in\.
BR\-06
Users must enter the correct password \(verified against the stored bcrypt hash\) to log in\.
BR\-07
After logging out, all active sessions or authentication tokens must be revoked\.
BR\-08
When a password reset is requested, the system must generate a reset token that is valid for 24 hours\.
BR\-09
To change their password, the user must provide a valid current password, and the new password must differ from the old one\.
BR\-10
Each hotel \(branch\) must have a valid name, a unique identifier, a detailed address, and geographic coordinates \(latitude and longitude\)\.
BR\-11
Each room must belong to a real hotel and be linked to an active \(not deleted/inactive\) room type\.
BR\-12
Room names must be unique within the same hotel\.
BR\-13
Room prices must be positive numbers\.
BR\-14
Each room must have at least one valid image \(\.jpg, \.jpeg, \.png, \.webp\) before it can be displayed\.
BR\-15
Room images must be displayed in a carousel format with at least one thumbnail\.
BR\-16
Room amenities are only displayed if their status is 'Active'; if 'Broken' or 'Missing', a note explaining the condition must be included\.
BR\-17
Each room amenity must be unique ΓÇö no duplicates within the same room\.
BR\-18
When a hotel is deleted, all rooms belonging to that hotel will stop being displayed to customers\.
BR\-19
Rooms can be set to Temporarily Locked or Maintenance status by the Branch Manager\.
BR\-20
Unauthenticated guests \(Guest\) can only view basic information about rooms and hotels ΓÇö they cannot make bookings\.
BR\-21
Users can only book rooms with 'Available' status that have not been deleted\.
BR\-22
Valid booking statuses include: Pending, Confirmed, Cancelled, Checked\-in, Checked\-out, Completed, and No\-show\.
BR\-23
A room cannot be booked by multiple users for overlapping check\-in/check\-out dates\.
BR\-24
Each customer must provide a valid national ID \(CCCD/CMND\) when making a booking\.
BR\-25
Walk\-in bookings must comply with room availability requirements and require a valid national ID\.
BR\-26
Check\-in time cannot be after check\-out time; the length of stay is calculated in number of nights\.
BR\-27
Available actions \(Check\-in, Room Change, Check\-out, Complete, Cancel\) depend on the current booking status\.
BR\-28
When a booking is in Completed status, no further changes are allowed\.
BR\-29
All booking status changes must be logged\.
BR\-30
Receptionists can only view and manage bookings for their assigned hotel\.
BR\-31
All booking data and transactions must be consistent and retrieved from backend services\.
BR\-32
A payment transaction can only be created when there is at least one confirmed booking\.
BR\-33
Each transaction must be linked to a customer account and have a payment status: Unpaid, Partial, or Paid\.
BR\-34
Branch Managers can apply credit balances from previous bookings to the current booking during check\-out\.
BR\-35
Staff can only manage hotels to which they are assigned\.
BR\-36
Only Super Admins have the authority to create, assign roles to, or disable accounts\.
BR\-37
Super Admins can create staff accounts and assign them to a branch\.
BR\-38
Housekeepers must claim a task before starting it\. Once claimed, the task status changes to In\_Progress\.
BR\-39
Housekeeper tasks have the following statuses: Pending, Urgent, In\_Progress, and Completed\.
BR\-40
Housekeepers may only perform tasks belonging to their assigned branch\.
BR\-41
Housekeepers can inspect room amenities and mark missing amenities along with their quantities\.
BR\-42
Amenity reports after room inspection must be saved to the corresponding booking invoice\.
BR\-43
A room is set to Maintenance status when an incident is reported\.
BR\-44
When a Housekeeper completes a cleaning task, the system automatically changes the room status to Available\.
BR\-45
Branch Managers can view and track the progress of all Housekeeper tasks within their branch\.
BR\-46
Branch Managers can view the branch dashboard in real time, including Housekeeper miss rates and revenue metrics\.
BR\-47
Super Admins can view the enterprise\-wide dashboard, including revenue reports by branch, room occupancy rates, and Housekeeper miss rates\.
BR\-48
A service is only active if it has not been deleted and is marked as active\.
BR\-49
All data records must include timestamp fields: createdAt and updatedAt\.
BR\-50
Branch Managers can manage Extra Services and Room Types for their branch\.
__*Table III\.36*__*: Business rules*
### __5\.2 Application Messages List__
Table III\.37: Shows the application messages list of the system
__\#__
__Message code__
__Message Type__
__Context__
__Content__
1
MSG01
In red, above the button sign\-in google
You have to you FPT email
Bß║ín phß║úi sß╗¡ dß╗Ñng email FPT
2
MSG02
In line, inside table
There is not any search result
Kh├┤ng c├│ dß╗» liß╗çu
3
MSG03
Popup message
Successfully
Th├ánh c├┤ng
4
MSG04
Popup message
Error
Lß╗ùi
5
MSG05
Popup message
Notice
H├ánh ─æß╗Öng n├áy sß║╜ tß╗½ chß╗æi hß║┐t tß║Ñt cß║ú c├íc pending request cß╗ºa facility n├áy
6
MSG07
Inline, under the text box
Not fill in required field
This field is required
__*Table III\.37*__*: Messages List*
# <a id="_9w7qnth7r3mz"></a>
# <a id="_bfcj0ocemvnu"></a>
# <a id="_oto4glkum4ia"></a>__IV\. Software Design Description__
## <a id="_ntmjw9q83o0f"></a>__1\. System Design__
### <a id="_d2mwlc9rrsd8"></a>__1\.1 System Architecture__
- Figure IV\.1 shows the software system architecture of the Facilities Management system\.
### <a id="_exgog6i27if3"></a>__1\.2 Package Diagram__
__*Package Descriptions*__
Table IV\.4 Shows the Packages contained in the project and describes what those packages do in the project
__No__
__Project__
__Package__
__Description__
01
Core
Configure
Service
Configure service
02
Constants
Constants of system
03
Entities
Base for entities model
04
Enum
Enum of system
05
ExecuteResult
Define response result
06
Extensions
Extensions
07
Helper
System helper
08
Model
System models
09
Repository
Base for repositories
10
Services
Base for services
11
Struc
Define the return result of method
12
Entities
Entities
Representation class of entity in database
13
Mapping
Mapping between C\# object and database object
14
Repository
Context
Database context
15
Interface
Define methods of repositories
16
Impl
Implementation class of repositories
17
Models
Data transfer object
18
Web
Configuration
Web config
19
Controllers
System controllers
20
Handlers
Handle internal system
21
Helper
Service helper
22
Identity
Identity configure
23
Localization
Localizer extensions
24
Models
View models
25
Resources
Multiple language
26
Scripts
Web 
27
Styles
Web css
28
Views
Web UI
__*Table IV\.4*__*: Package description*
## <a id="_6pjk2kbk48b9"></a>__2\. Database Design__
### <a id="_xdmsjyrvilmk"></a>2\.1\. Database Schema 
__*Figure IV\.5*__*: Database schema*
### <a id="_c0hm69dk3krn"></a>2\.2\. Table Description 
Table IV\.6 Represents Entity entities and descriptions\.\.
__No__
__Table__
__Description__
1
Account 
Store login credentials for all users \(email, password, role, verification status\) 
2
Customer 
Store customer profile \(full name, phone, ID card, avatar\), linked to an account 
3
Employee 
Store staff profile \(phone, gender, salary, avatar\), linked to an account 
4
Role 
User with different role has different jurisdiction 
5
Role\_Assignment 
Assign a role at a specific branch to an account \(resolves staff working at multiple branches\) 
6
Branch 
Store branch detail \(code, name, location, hotline, deposit rate, pending timeout\) 
7
RoomType 
Store room category detail \(name, bed type, capacity, area, base price, status\) 
8
RoomPrices 
Store dynamic room pricing by date, weekday/weekend, holiday and discount 
9
Room 
Store physical room detail \(room number, floor, status\) and its booking availability 
10
Amenities 
Store standard amenity list and the price charged when an item is missing 
11
RoomAmenity 
Track which amenities a room has, their quantity and condition 
12
Service 
Store branch service catalog \(service name, price, status\) 
13
Booking 
Booking detail including dates, amounts, status, and the services used in this booking 
14
Payment 
Store payment records of a booking \(deposit and remaining\), method and transaction status 
15
HoldRoom 
Temporarily hold a room while the customer has not completed payment 
16
HousekeepingTask 
Store room cleaning and inspection tasks assigned to housekeepers 
17
Review 
Store customer reviews and ratings for rooms, with staff replies 
__*Table IV\.6*__*: Describe entity database*
## <a id="_auzd8whkwnu0"></a>__3\. Detailed Design__
Figure IV\.7 Notation for UML diagram
### <a id="_s0qi3i9nruh8"></a>__3\.1 Login__
3\.1\.1 Class Diagram
Figure IV\.8: Shows the Login class diagram
__*Figure IV\.8*__*:Login Class Diagram*
3\.1\.2\. Sequence Diagram 
Figure IV\.9: Shows the sequence diagram
__*Figure IV\.9*__*:Login Sequence Diagram*
### <a id="_z4xz1qmj4ud3"></a>__3\.2 Manage User __
#### <a id="_azgakkg68gm2"></a>__*3\.2\.1 View User *__
3\.2\.1\.1 *Class Diagram*
Figure IV\.10: Shows the view user class diagram
__*Figure IV\.10*__*:View User Class Diagram*
3\.2\.1\.2 *Sequence Diagram *
Table IV\.11: Shows the view user sequence diagram
__*Figure IV\.11*__*:View User Sequence Diagram*
#### <a id="_mctc0vd8dbou"></a>__*3\.2\.2 Update User *__
3\.2\.2\.1 *Class Diagram*
Figure IV\.12: Shows the update user class diagram
__*Figure IV\.12*__*:Update User Class Diagram*
3\.2\.2\.2 *Sequence Diagram *
Figure IV\.13: Shows the update user sequence diagram
__*Figure IV\.13*__*:Update User Sequence Diagram*
#### <a id="_vg7pjujv39xt"></a>__*3\.2\.3 View user profile *__
3\.2\.3\.1 *Class Diagram*
Figure IV\.14: Shows the view user profile class diagram
__*Figure IV\.14*__*:View User Profile Class Diagram*
3\.2\.3\.2 *Sequence Diagram *
Figure IV\.15: Shows the view user profile sequence diagram
__*Figure IV\.15*__*:View User Profile Sequence Diagram*
#### <a id="_9gdb84ophcx"></a>__*3\.2\.4 Search Account*__
3\.2\.4\.1 *Class Diagram*
Figure IV\.16: Shows the search account class diagram
__*Figure IV\.16*__*:Search Account Class Diagram*
3\.2\.4\.2 *Sequence Diagram *
Figure IV\.17: Shows the search account sequence diagram
__*Figure IV\.17*__*:Search Account Sequence Diagram*
### <a id="_ogs0222alli3"></a>__3\.2 Manage Booking __
#### <a id="_eyzw7lx4tzxs"></a>__*3\.2\.1 View Booking *__
3\.2\.1\.1 *Class Diagram*
Figure IV\.18: Shows the view booking class diagram
__*Figure IV\.18*__*:View Booking Class Diagram*
3\.3\.1\.2 *Sequence Diagram *
Figure IV\.19: Shows the view booking sequence diagram
__*Figure IV\.19*__*:View Booking Sequence Diagram*
#### <a id="_izqpbqybqkmk"></a>__*3\.2\.2 Find booking by user and facility  *__
3\.2\.2\.1 *Class Diagram*
Figure IV\.20: Shows the find booking by user and facility class diagram
__*Figure IV\.20*__*:Find booking by user and facility Class Diagram*
3\.3\.2\.3 *Sequence Diagram *
Figure IV\.21: Shows the find booking by user facility sequence diagram
__*Figure IV\.21*__*:Find booking by user and facility Sequence Diagram*
#### <a id="_4ajeh6tar249"></a>__*3\.2\.3 Update Booking *__
3\.2\.3\.1 *Class Diagram*
Figure IV\.22: Shows the update booking class diagram
__*Figure IV\.22*__*:Update Booking Class Diagram*
3\.2\.3\.2 *Sequence Diagram *
Figure IV\.23: Shows the update booking sequence diagram
__*Figure IV\.23*__*:Update Booking Sequence Diagram*
#### <a id="_ug072nddxgbz"></a>__*3\.2\.4 Create Booking *__
3\.2\.4\.1 *Class Diagram*
Figure IV\.24: Shows the create booking class diagram
__*Figure IV\.24*__*:Create Booking Class Diagram*
##### <a id="_l6khtvw0krm3"></a>
##### <a id="_aj9q0my2isop"></a>
##### <a id="_s8g41nodqzte"></a>
##### <a id="_aaubyjbsyifr"></a>
##### <a id="_nss6r16guinh"></a>
##### <a id="_gfbdnkux8z21"></a>
##### <a id="_pit9aaqdyfuy"></a>
##### <a id="_g9oznsfocwtg"></a>
##### <a id="_srtqqt1tzyku"></a>
##### <a id="_z4imahgau6r1"></a>
##### <a id="_28d1kgvob3f"></a>
##### <a id="_so4pwts9gcl7"></a>
##### <a id="_ufdszmvv393"></a>
##### <a id="_mmsnkqfspgbq"></a>
3\.2\.4\.2 *Sequence Diagram *
Figure IV\.25: Shows the create booking sequence diagram
__*Figure IV\.25*__*:Create Booking Sequence Diagram*
#### <a id="_t8el9d7cp9u0"></a>__*3\.2\.5 Status Booking *__
3\.2\.5\.1 *Class Diagram*
Figure IV\.26: Shows the status booking class diagram
__*Figure IV\.26*__*:Status Booking Class Diagram*
3\.2\.5\.2 *Sequence Diagram *
Figure IV\.27: Shows the status booking sequence diagram
__*Figure IV\.27*__*:Status Booking Sequence Diagram*
#### <a id="_u2lthxw1o4en"></a>__*3\.2\.6 Dashboard by year *__
3\.2\.6\.1 *Class Diagram*
Figure IV\.28: Shows the dashboard by year class diagram
__*Figure IV\.28*__*:Dashboard by year Class Diagram*
3\.2\.6\.2 Sequence Diagram 
Figure IV\.29: Shows the dashboard by year sequence diagram
__*Figure IV\.29*__*:Dashboard by year Sequence Diagram*
#### <a id="_a991hueojrcj"></a>__*3\.2\.7 Dashboard by week *__
3\.2\.7\.1 Class Diagram
Figure IV\.30: Shows dashboard by week class diagram
__*Figure IV\.30*__*:Dashboard by week Class Diagram*
3\.2\.7\.2 Sequence Diagram 
Figure IV\.31: Shows the dashboard by week sequence diagram
__*Figure IV\.31 *__*Dashboard by week Sequence Diagram*
### <a id="_rmx0wbvdg0ge"></a>__3\.3 Manage Facility__
#### <a id="_895996ef4r0y"></a>__*3\.3\.1 View Facility*__
3\.3\.1\.1 *Class Diagram*
Figure IV\.32: Shows the view facility class diagram
__*Figure IV\.32*__*:View Facility Class Diagram*
3\.3\.1\.2 *Sequence Diagram *
Figure IV\.33: Shows the view facility sequence diagram
__*Figure IV\.33*__*:View Facility Sequence Diagram*
#### <a id="_7nz8btkopddt"></a>__*3\.3\.2 Create Facility*__
3\.3\.2\.1 *Class Diagram*
Figure IV\.34:: Shows the create facility class diagram
__*Figure IV\.34*__*:Create Facility Class Diagram*
3\.3\.2\.2 *Sequence Diagram *
Figure IV\.35: Shows the create facility sequence diagram
__*Figure IV\.35*__*:Create Facility Sequence Diagram*
#### <a id="_8qi6f1x7a4p4"></a>__*3\.3\.3 Update Facility*__
3\.3\.3\.1 *Class Diagram*
Figure IV\.36: Shows the update facility class diagram
__*Figure IV\.36*__*:Update Facility Class Diagram*
3\.3\.3\.2 *Sequence Diagram *
Figure IV\.37: Shows the update facility sequence diagram
__*Figure IV\.37*__*:Update Facility Sequence Diagram*
#### <a id="_ey3vij5ih36s"></a>__*3\.3\.4 Change Status Facility*__
3\.3\.4\.1 *Class Diagram*
Figure IV\.38: Shows the change status facility class diagram
__*Figure IV\.38*__*:Change Status Facility Class Diagram*
3\.3\.4\.2 *Sequence Diagram *
Figure IV\.39: Shows the change status facility sequence diagram
__*Figure IV\.39*__*:Change Status Facility Sequence Diagram*
#### <a id="_dq8f3kqm4rki"></a>__*3\.3\.5 View Detail Facility*__
3\.3\.5\.1 *Class Diagram*
Figure IV\.40: Shows the view detail facility class diagram
__*Figure IV\.40*__*:View Detail Facility Class Diagram*
3\.3\.5\.2 *Sequence Diagram*
Figure IV\.41: Shows the view detail facility sequence diagram
__*Figure IV\.41\. *__*View Detail Facility Sequence Diagram*
### <a id="_iud06qfbejh3"></a>__3\.4 Manage Category__
#### <a id="_2djvfp19330g"></a>__*3\.4\.1 View Category*__
3\.4\.1\.1 *Class Diagram*
Figure IV\.42: Shows the view category class diagram
__*Figure IV\.42*__*:View Category Class Diagram*
3\.4\.1\.2 *Sequence Diagram *
Figure IV\.43: Shows the view category sequence diagram
__*Figure IV\.43*__*:View Category Sequence Diagram*
#### <a id="_vm4u22m5u2pn"></a>__*3\.4\.2 Create Category*__
3\.4\.2\.1 *Class Diagram*
Figure IV\.44: Shows the create category class diagram
__*Figure IV\.44*__*:Create Category Class Diagram*
3\.4\.2\.2 *Sequence Diagram *
Figure IV\.45: Shows the create category sequence diagram
__*Figure IV\.45*__*:Create Category Sequence Diagram*
#### <a id="_bdaez48ni04v"></a>__*3\.4\.3 Update Category*__
3\.4\.3\.1 *Class Diagram*
Figure IV\.46: Shows the update category class diagram
__*Figure IV\.46*__*:Update Category Class Diagram*
3\.4\.3\.2 *Sequence Diagram *
Figure IV\.47: Shows the update category sequence diagram
__*Figure IV\.47*__*:Update Category Sequence Diagram*
### <a id="_257fytvfn6ga"></a>__3\.5 Manage Comments__
#### <a id="_cs9t7zw1y6ig"></a>__*3\.5\.1 View Comment*__
3\.5\.1\.1 *Class Diagram*
Figure IV\.48: Shows the view comet class diagram
__*Figure IV\.48*__*:View Comment Class  Diagram*
3\.5\.1\.2 *Sequence Diagram *
Figure IV\.49: Shows the view comment sequence diagram
__*Figure IV\.49*__*:View Comment Sequence Diagram*
#### <a id="_teqt4dhyozv3"></a>__*3\.5\.2 Create Comment*__
3\.5\.2\.1 *Class Diagram*
Figure IV\.50: Shows the create comment class diagram
__*Figure IV\.50*__*:Create Comment Class Diagram*
3\.5\.2\.2 *Sequence Diagram *
Figure IV\.51: Shows the create comment sequence diagram
__*Figure IV\.51*__*:Create Comment Sequence Diagram*
#### <a id="_qu24uawbmlf"></a>__*3\.5\.3 Check Comment Permission*__
3\.5\.3\.1 *Class Diagram*
Figure IV\.52: Shows the check comment permission class diagram
__*Figure IV\.52*__*:Check Comment Permission Class Diagram*
3\.5\.3\.2 *Sequence Diagram*
Figure IV\.53: Shows the check comment permission sequence diagram
__*Figure IV\.53*__*:Check Comment Permission Sequence Diagram*
### <a id="_j1rtydgniup1"></a>__3\.6 Manage Notification__
#### <a id="_83sf4m97u127"></a>__*3\.6\.1 View notification*__
3\.6\.1\.1 *Class Diagram*
Figure IV\.54: Shows the view notification class diagram
__*Figure IV\.54 *__*View notification Class Diagram*
3\.6\.1\.2 *Sequence Diagram  *
Figure IV\.55: Shows the view notification sequence diagram
__*Figure IV\.55*__*:View notification Sequence Diagram*
#### <a id="_fu52wwb8p6c"></a>__*3\.6\.2 Update Notification*__
3\.6\.2\.1 *Class Diagram*
Figure IV\.56: Shows the update notification class diagram
__*FigureIV\.56*__*:Update Notification Class  Diagram*
3\.6\.2\.2 *Sequence Diagram  *
Figure IV\.57: Shows the update notification sequence diagram
__*Figure IV\.56 *__*Update Notification Sequence Diagram*
# <a id="_4c3w0f1rzgmm"></a>__V\. Software Testing Documentation__
## <a id="_mrpe8f34hdu"></a>__1\. Scope of Testing__
### <a id="_twdg4qv8csxh"></a>1\.1\. Testing Stages
Figure V\.1: Description of testing stages V\-model
*Figure V\.1: Test stages base on V\-Model*
In this project, there are 4 phases in the testing process: Unit testing, Integration testing, System testing and Acceptance testing\.
Figure V\.2: Description of testing stages
No\.
Test Stages
Description
1
Unit Testing
Unit testing, a testing technique using which individual modules are tested to determine if there are any issues by the developer himself\. It is concerned with functional correctness of the standalone modules\.
2
Integration Testing
Integration testing is done to test the modules/ components when integrated to verify that they work as expected to test the modules which are working fine individually does not have issues when integrated\.
3
System Testing
System testing means testing the system as a whole\. All the modules/ components are integrated in order to verify if the system works as expected or not\.
4
Acceptance Testing
Acceptance testing is a type of testing where client/ business/ customer test the software with real time business scenarios\. This is the last phase of testing, after which the software goes into production\.
*Table V\.2: Description of test stages*
### <a id="_76w5u7631427"></a>1\.2\. Range of Testing
All functions defined in the System Requirement Specification will be performed with the last version\.
## <a id="_96fuklbn19r0"></a>__2\. Test Strategy__
### <a id="_yuxj7sfy70n3"></a>__2\.1 Testing Types__
The test team has to test the following type on Google Chrome browser:
- GUI Testing
- Functional Testing
- Regression Testing
Figure V\.3: Description of testing types
No\.
Test Stages
Description
1
GUI Testing
GUI Testing is a software testing type that checks the Graphical User Interface of the software\. The purpose is to ensure the functionalities of software application work as per specifications by checking screens and controls like menus, buttons, icons, etc\.
2
Functional
Testing
Functional testing is a kind of black\-box testing that is performed to confirm that the functionality of an application or system is behaving as expected\.
3
Regression Testing
Regressing testing is a type of testing that is done to verify that a code change in the software does not impact the existing functionality of the product\. This is to ensure that the product works fine with new functionality, bug fixes or any changes to the existing feature\.
*			             Table V\.3: Description of testing types*
### <a id="_4yaoubwp9n8b"></a>__2\.2 Test Levels__
Figure V\.4: Description of testing levels
__Type of Tests__
__Test Level__
__Unit__
__Integration__
__System__
__Acceptance__
GUI Testing
X
X
X
Functional Testing
X
X
### <a id="_bv0fgcd7jpb5"></a>*Table V\.4: Description of testing levels*
### <a id="_bn34hc8mjij9"></a>__2\.3 Supporting Tools__
- Microsoft Excel: manages test cases and data index
		*Figure V\.4: Microsoft Excel Office*
- Microsoft Excel Online: manage bugs and status of fixed
		*Figure V\.5: Microsoft Excel Online*
- Jira: manage time to keep test plan
		*Figure V\.6: Jira*
- Google Chrome Browser: the interface to test
		*Figure V\.7: Google Chrome Browser*
## <a id="_l4o5dc9avq5l"></a>__3\. Test Plan__
### <a id="_ih2krl18s8gs"></a>__3\.1 Human Resources__
Figure V\.8: Description of human resources
__Worker/Doer__
__Role__
__Specific Responsibilities/Comments__
ManhPD
Team member
- Create test cases and perform unit tests\.
- Fix bugs back\-end
KietHT
Team member
- Create a test plan\.
- Create test cases and perform integration tests\.
- Create test cases and perform system tests\.
- Create test cases, checklists and perform acceptance tests\.
- Summaries test reports\.
ToanDT
Team member
- Fix bugs front\-end
*Table V\.8: Description of human resource*
### <a id="_wdnehy4kmzdd"></a>__3\.2 Test Environment__
Figure V\.9: Description of testing environment
__Purpose__
__Tool__
__Provider__
__Version__
Unit Testing
Visual Studio Code 2022
Microsoft Corporation
17\.3\.4
Integration Testing
Chrome
Google
115\.0\.5790\.171\(Official Build\) \(64\-bit\)
System Testing
Chrome
Google
115\.0\.5790\.171\(Official Build\) \(64\-bit\)
Acceptance Testing
Chrome
Google
115\.0\.5790\.171\(Official Build\) \(64\-bit\)
*Table V\.9: Description of testing environments*
# <a id="_530ls853p2d"></a>
# <a id="_aagtzybck80l"></a>__VI\. Release Package & User Guides__
## <a id="_mrrxpla6ntec"></a>__1\. Deliverable Package__
Figure VI\.1: Description of deliverables
__No\.__
__Deliverable Item__
__Description__
1
Source Codes
Facility\-Management\-System\.zip
2
Database Script\(s\)
Data\.zip
3
SRS
Software Requirement Specification\.docx
4
SDS
Software Design Document\.docx
5
Final Report
Final Project Report\.docx
6
Unit Test
G3\_Unit\_Test Case\.xlsx
*Table VI\.1: Deliverable package*
## <a id="_cjfgwndyr592"></a>__2\. Installation Guides__
### <a id="_7npoupsmz3lk"></a>__2\.1 System Requirements__
Below are system requirements necessary to support the web application and help us to deploy the code easily:
- CPU: 2\.5GHZ
- RAM: 8GB
- Minimum disk space: 10GB
- Network: Internet connection
### <a id="_d67xxg5926hf"></a>__2\.2 Hosting requirement__
1. Extract Facility\-Management\-System\.zip
2. Open folder Client and Server in VS Code
3. Open terminal and run ΓÇ£npm iΓÇ¥ for both folder
4. Extract Data\.zip
5. Open MongoDB and import json file into Collection
6. ├în folder Server, run ΓÇ£npm startΓÇ¥
7. ├în folder Client\. run ΓÇ£npm run devΓÇ¥
8. Open your browse with link ΓÇ£http://localhost:3000/ΓÇ¥
## <a id="_o92uomoljtqc"></a>__3\. User Manual__
### <a id="_jyl4jv723cu6"></a>__3\.1 Overview__
- The Facilities Management System was born based on the need of facilities management in FPT Education\. FPT Education is very large with 10 campuses and nearly 150,000 students\. Facilities in FPT are used and booked everyday which is really hard to manage and follow by using paper\. With high demands to manage facilities more effectively, the campuses within the FPT education system require an efficient management system to support their daily operations\.
### <a id="_nabxhl9le04o"></a>__3\.2 Role User__
- Access the home page\.
- Users can login by clicking on __ΓÇ£─É─âng nhß║¡pΓÇ¥__ at the header\.
- Users can login to the system by clicking on __ΓÇ£─É─âng nhß║¡pΓÇ¥__, users will go to the login page and login to the system by google account with FPT email\.
- After login, user will be navigated to homepage
- In the home page, users will see the list of categories, top 8 of facilities
- When you click on a specific facilities, you will be navigated to the facilities detail page
- Click the avatar in the header, you can see a drop\-down list\. Select ΓÇ£Lß╗ïch sß╗¡ ─æß║╖t ph├▓ngΓÇ¥ to view all of booking request and their status\. You can search facilities by name in here
- You can see notification about your booking request when you click in bell icon in the header
- In homepage, you can click the icon to open chat box and send your message to admin
- After you use a facility, you can evaluate for that facility by voting and comment in facility detail page
- Click the avatar in the header and choose ΓÇ£Hß╗ô s╞í cß╗ºa t├┤iΓÇ¥ to open your Profile and update if you want\. You can choose ΓÇ£─É─âng xuß║ÑtΓÇ¥ also to log out
### <a id="_jky4wtrbodsu"></a>__3\.3 Admin Role__
- Users login to the system with an account with the role __ΓÇ£AdminΓÇ¥__\. Users can see the Dashboard for __ΓÇ£AdminΓÇ¥__\.
- Click ΓÇ£Quß║ún l├╜ ph├▓ng, s├ón b├│ngΓÇ¥ to view facilities list
- From facilities list page:
\+, Click in \+ button to create a new facilities
\+, Click in ΓÇ£Cß║¡p nhß║¡tΓÇ¥ to update facility
\+,Click in ΓÇ£XemΓÇ¥ to view record of change of facility
\+, Change Active/Inactive to change status of facility
- Similar to Category List
- Click in ΓÇ£Duyß╗çt y├¬u cß║ºu ─æß║╖t s├ón, ph├▓ng hß╗ìcΓÇ¥ to view booking request list
Then admin can choose ΓÇ£Chß║Ñp nhß║¡nΓÇ¥ to approve or ΓÇ£Hß╗ºyΓÇ¥ to disapprove with reason
- ΓÇ£C├íc y├¬u cß║ºu ─æ╞░ß╗úc duyß╗çtΓÇ¥ display all accepted request
- ΓÇ£C├íc y├¬u cß║ºu kh├┤ng ─æ╞░ß╗úc duyß╗çtΓÇ¥ display all rejected request
- ΓÇ£C├íc y├¬u cß║ºu qu├í hß║ínΓÇ¥ display all overdue request
- ΓÇ£Quß║ún l├╜ t├ái khoß║únΓÇ¥ displays an account list in the system\. Admin can also change account status Active/Inactive of Student only
- Click the message icon in the header to open the chat screen\. You can chat with user in this page
