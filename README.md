# Table Order Connect

ช่วยสร้างระบบสั่งอาหารด้วย QR Code (Web Application)  ตามรายละเอียดดังนี้

หน้าหลัก (Main Dashboard/Admin)

มีระบบ Dashboard แสดงรายการออร์เดอร์ที่เข้ามาใหม่พร้อมเสียงแจ้งเตือนแบบ Real-time



แสดงสถานะภาพรวมของโต๊ะอาหารทั้งหมด



มีหน้าสรุปยอดขายรายวันและจำนวนรายการอาหารที่ขายได้



 หน้าสั่งอาหารสำหรับลูกค้า (Client Side):



ระบบเลือกโต๊ะ: ออกแบบหน้าจอที่มีเลขโต๊ะ (Table ID) แบ่งเป็นโซนหรือแถว





เมนูอาหาร: แสดงรายการอาหารแยกตามหมวดหมู่ (Categories) มีรูปภาพ ราคา และสถานะเมนู (มีของ/หมด)





ระบบตะกร้าสินค้า: สามารถเลือกรายการอาหาร ระบุจำนวน และคำนวณราคาสุทธิได้



หน้าจัดการสถานะ (Kitchen/Staff Side):

มีหน้าจอสำหรับพ่อครัวเพื่อกดเปลี่ยนสถานะออร์เดอร์ เช่น 'กำลังทำ' หรือ 'ทำเสร็จแล้ว' เพื่อแจ้งเตือนกลับไปยังลูกค้า



เจ้าหน้าที่สามารถจัดการสถานะเมนูอาหาร (เปิดขาย/สินค้าหมด) ได้แบบ Real-time



หน้าชำระเงินและแจ้งเตือน:

ระบบรองรับการชำระเงินทั้งเงินสดและ QR Code



พนักงานสามารถกดยืนยันการชำระเงินและออกใบเสร็จจากระบบได้



 เงื่อนไขเพิ่มเติม:

ระบบต้องป้องกัน Fake Orders โดยจะสั่งอาหารได้ก็ต่อเมื่อพนักงานทำการ 'เปิดโต๊ะ' ในระบบก่อนเท่านั้น



ใช้โครงสร้างฐานข้อมูล (Schema) ตามตาราง: Tables, Products, Orders, Orderitems และ Payments "

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e555cd20-8e97-436e-b2d6-8f9a17f3c238).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
