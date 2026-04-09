(function () {
  const STORAGE_KEY = "laoverse_lang";
  const DEFAULT_LANG = "lo";
  const SUPPORTED_LANGS = ["lo", "th", "en"];

  const DICT = {
    lo: {
      "nav.home": "ໜ້າຫຼັກ",
      "nav.profile": "ໂປຣໄຟລ໌",
      "nav.friends": "ໝູ່ເພື່ອນ",
      "nav.note": "ແຈ້ງເຕືອນ",
      "nav.message": "ຂໍ້ຄວາມ",
      "nav.settings": "ຕັ້ງຄ່າ",
      "nav.backSettings": "ກັບໄປຕັ້ງຄ່າ",
      "common.loading": "ກຳລັງໂຫຼດ...",
      "common.submit": "ສົ່ງ",
      "common.cancel": "ຍົກເລີກ",
      "common.save": "ບັນທຶກ",
      "common.downloadFile": "ດາວໂຫຼດໄຟລ໌",
      "common.fileNone": "ບໍ່ມີໄຟລ໌ຖືກເລືອກ",
      "time.justNow": "ຫາກໍ່ຜ່ານມາ",
      "time.minuteAgo": "{count} ນາທີກ່ອນ",
      "time.hourAgo": "{count} ຊົ່ວໂມງກ່ອນ",
      "time.dayAgo": "{count} ມື້ກ່ອນ",
      "time.weekAgo": "{count} ອາທິດກ່ອນ",
      "time.monthAgo": "{count} ເດືອນກ່ອນ",
      "time.yearAgo": "{count} ປີກ່ອນ",
      "feed.title": "ໂພສສັງຄົມ",
      "feed.placeholder": "ທ່ານກຳລັງຄິດຫຍັງຢູ່?",
      "feed.uploadImage": "ອັບໂຫຼດ",
      "feed.post": "ໂພສ",
      "feed.noPosts": "ຍັງບໍ່ມີໂພສ",
      "feed.commentPlaceholder": "ຂຽນຄຳເຫັນ...",
      "feed.replyPlaceholder": "ພິມຄຳຕອບກັບ...",
      "feed.reply": "ຕອບກັບ",
      "feed.emptyPostError": "ກະລຸນາປ້ອນຂໍ້ຄວາມ ຫຼືເລືອກຮູບພາບ",
      "feed.postSuccess": "ໂພສສຳເລັດ!",
      "feed.postFailed": "ໂພສບໍ່ສຳເລັດ",
      "feed.loadFailed": "ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດໂພສ",
      "feed.commentRequired": "ກະລຸນາປ້ອນຄຳເຫັນ",
      "feed.replyRequired": "ກະລຸນາປ້ອນຄຳຕອບກັບ",
      "feed.commentFailed": "ບໍ່ສາມາດສົ່ງຄຳເຫັນ",
      "feed.replyFailed": "ບໍ່ສາມາດສົ່ງຄຳຕອບກັບ",
      "feed.noComments": "ຍັງບໍ່ມີຄຳເຫັນ",
      "friends.title": "ລາຍຊື່ໝູ່ເພື່ອນ",
      "friends.searchPlaceholder": "ຄົ້ນຫາໝູ່ເພື່ອນ...",
      "friends.requests": "ຄຳຂໍເປັນໝູ່",
      "friends.myFriends": "ໝູ່ເພື່ອນຂອງຂ້ອຍ",
      "friends.sendMessage": "ສົ່ງຂໍ້ຄວາມ",
      "friends.remove": "ລຶບໝູ່",
      "friends.accept": "ຍອມຮັບ",
      "friends.reject": "ປະຕິເສດ",
      "friends.sendRequest": "ສົ່ງຄຳຂໍເປັນໝູ່",
      "friends.noFriends": "ຍັງບໍ່ມີໝູ່ເພື່ອນ",
      "friends.noRequests": "ບໍ່ມີຄຳຂໍເປັນໝູ່",
      "friends.noUsers": "ບໍ່ພົບຜູ້ໃຊ້",
      "friends.accepted": "ຍອມຮັບຄຳຂໍສຳເລັດ!",
      "friends.rejected": "ປະຕິເສດຄຳຂໍສຳເລັດ",
      "friends.requestSent": "ສົ່ງຄຳຂໍເປັນໝູ່ສຳເລັດ!",
      "friends.requestFailed": "ສົ່ງຄຳຂໍບໍ່ສຳເລັດ",
      "friends.removeConfirm": "ທ່ານຕ້ອງການລຶບໝູ່ຄົນນີ້ຈິງບໍ?",
      "friends.removeSuccess": "ລຶບໝູ່ສຳເລັດ",
      "messages.title": "ຂໍ້ຄວາມ",
      "messages.friendsHeader": "ລາຍຊື່ໝູ່ເພື່ອນ",
      "messages.loadingFriends": "ກຳລັງໂຫຼດລາຍຊື່ໝູ່ເພື່ອນ...",
      "messages.emptyChat": "ເລືອກໝູ່ເພື່ອເລີ່ມແຊັດ",
      "messages.attachFile": "ແນບໄຟລ໌",
      "messages.inputPlaceholder": "ພິມຂໍ້ຄວາມ...",
      "messages.send": "ສົ່ງ",
      "messages.noName": "ບໍ່ມີຊື່",
      "messages.unknownSender": "ບໍ່ຮູ້ຊື່",
      "messages.audioUnsupported": "ເບຣາວເຊີບໍ່ຮອງຮັບສຽງ",
      "messages.videoUnsupported": "ເບຣາວເຊີບໍ່ຮອງຮັບວິດີໂອ",
      "messages.downloadPdf": "ດາວໂຫຼດ PDF",
      "messages.downloadFile": "ດາວໂຫຼດໄຟລ໌",
      "note.title": "ໂພສທີ່ເຄີຍໃຫ້ຄຳເຫັນ",
      "note.empty": "ທ່ານຍັງບໍ່ໄດ້ໃຫ້ຄຳເຫັນໃນໂພສໃດໆ",
      "note.loadFailed": "ບໍ່ສາມາດໂຫຼດໂພສໄດ້",
      "note.likeFailed": "ບໍ່ສາມາດກົດຖືກໃຈໂພສໄດ້",
      "note.addCommentFailed": "ບໍ່ສາມາດເພີ່ມຄຳເຫັນໄດ້",
      "profile.title": "ໂປຣໄຟລ໌",
      "profile.userTitle": "ໂປຣໄຟລ໌ຜູ້ໃຊ້",
      "profile.posts": "ໂພສ",
      "profile.friends": "ໝູ່ເພື່ອນ",
      "profile.edit": "ແກ້ໄຂໂປຣໄຟລ໌",
      "profile.editTitle": "ແກ້ໄຂໂປຣໄຟລ໌",
      "profile.username": "ຊື່ຜູ້ໃຊ້:",
      "profile.newPhoto": "ຮູບໂປຣໄຟລ໌ໃໝ່",
      "profile.saveChanges": "ບັນທຶກການປ່ຽນແປງ",
      "profile.sendRequest": "ສົ່ງຄຳຂໍເປັນໝູ່",
      "profile.alreadyFriend": "ເປັນໝູ່ແລ້ວ",
      "profile.pending": "ລໍຖ້າການຕອບຮັບ",
      "profile.notFound": "ບໍ່ພົບໂປຣໄຟລ໌",
      "profile.loadFailed": "ເກີດຂໍ້ຜິດພາດໃນການໂຫຼດໂປຣໄຟລ໌",
      "profile.noPosts": "ຍັງບໍ່ມີໂພສ",
      "profile.showPostsFailed": "ບໍ່ມີໂພສທີ່ຈະສະແດງ",
      "profile.updateSuccess": "ອັບເດດໂປຣໄຟລ໌ສຳເລັດ!",
      "profile.updateFailed": "ອັບເດດບໍ່ສຳເລັດ",
      "profile.connectionError": "ເກີດຂໍ້ຜິດພາດໃນການເຊື່ອມຕໍ່",
      "profile.unknownUser": "ບໍ່ຮູ້ຊື່",
      "settings.title": "ຕັ້ງຄ່າ",
      "settings.language": "ພາສາ",
      "settings.theme": "ປ່ຽນຮູບແບບສີ (Theme)",
      "settings.theme.default": "Theme ເດີມ",
      "settings.theme.green": "Theme ສີຂຽວ",
      "settings.theme.pink": "Theme ສີຊົມພູ",
      "settings.theme.light": "Theme ສະຫວ່າງ",
      "settings.personal": "ຂໍ້ມູນສ່ວນຕົວ",
      "settings.saveProfile": "ບັນທຶກຂໍ້ມູນ",
      "settings.password": "ປ່ຽນລະຫັດຜ່ານ",
      "settings.newPassword": "ລະຫັດຜ່ານໃໝ່",
      "settings.confirmPassword": "ຢືນຢັນລະຫັດຜ່ານໃໝ່",
      "settings.passwordHint": "ລະຫັດຕ້ອງມີຢ່າງນ້ອຍ 8 ຕົວ ແລະມີ A-Z, a-z, 0-9 ແລະສັນຍາລັກ",
      "settings.changePassword": "ປ່ຽນລະຫັດຜ່ານ",
      "settings.support": "ຊ່ອງທາງຕິດຕໍ່ຊ່ວຍເຫຼືອ",
      "settings.goSupport": "ໄປໜ້າຕິດຕໍ່ຜູ້ດູແລເວັບ",
      "settings.account": "ບັນຊີ",
      "settings.logout": "ອອກຈາກລະບົບ",
      "settings.deleteAccount": "ລຶບບັນຊີຜູ້ໃຊ້",
      "settings.saved": "ບັນທຶກຂໍ້ມູນສຳເລັດ",
      "settings.saveFail": "ບັນທຶກບໍ່ສຳເລັດ",
      "settings.themeOk": "ປ່ຽນ Theme ສຳເລັດ",
      "settings.badPassword": "Password ບໍ່ຜ່ານເງື່ອນໄຂ",
      "settings.pwMismatch": "Confirm password ບໍ່ກົງກັນ",
      "settings.passwordChanged": "ປ່ຽນລະຫັດຜ່ານສຳເລັດ",
      "settings.passwordChangeFail": "ປ່ຽນລະຫັດບໍ່ສຳເລັດ",
      "settings.deleteConfirm": "ຢືນຢັນລຶບບັນຊີຖາວອນ?",
      "settings.deleteSuccess": "ລຶບບັນຊີສຳເລັດ",
      "settings.deleteFail": "ລຶບບັນຊີບໍ່ສຳເລັດ",
      "support.title": "ຕິດຕໍ່ຝ່າຍຊ່ວຍເຫຼືອ",
      "support.pageTitle": "ຕິດຕໍ່ຊ່ວຍເຫຼືອ",
      "support.contactTitle": "ຂໍ້ມູນຕິດຕໍ່",
      "support.facebook": "Facebook",
      "support.gmail": "Gmail",
      "support.tel": "ເບີໂທ",
      "support.whatsapp": "WhatsApp",
      "support.subject": "ຫົວຂໍ້ບັນຫາ",
      "support.message": "ລາຍລະອຽດບັນຫາ",
      "support.send": "ສົ່ງຄຳຮ້ອງຂໍ",
      "support.fillAll": "ກະລຸນາກອກຂໍ້ມູນໃຫ້ຄົບ",
      "support.success": "ສົ່ງຄຳຮ້ອງຂໍສຳເລັດ",
      "support.fail": "ສົ່ງບໍ່ສຳເລັດ",
      "auth.loginTitle": "ເຂົ້າສູ່ລະບົບ - LaoVerse",
      "auth.registerTitle": "ລົງທະບຽນ - LaoVerse",
      "auth.loginHeading": "ເຂົ້າສູ່ລະບົບ",
      "auth.registerHeading": "ສະໝັກສະມາຊິກ",
      "auth.username": "ຊື່",
      "auth.email": "ອີເມວ",
      "auth.password": "ລະຫັດຜ່ານ",
      "auth.confirmPassword": "ຢືນຢັນລະຫັດຜ່ານ",
      "auth.login": "ເຂົ້າສູ່ລະບົບ",
      "auth.register": "ສະໝັກ",
      "auth.noAccount": "ຍັງບໍ່ມີບັນຊີ?",
      "auth.haveAccount": "ມີບັນຊີຢູ່ແລ້ວ?",
      "auth.fillRegister": "ໃສ່ຂໍ້ມູນໃຫ້ຄົບຖ້ວນ",
      "auth.fillLogin": "ໃສ່ຊື່ແລະລະຫັດຜ່ານໃຫ້ຄົບຖ້ວນ",
      "auth.passwordMismatch": "ລະຫັດຜ່ານບໍ່ກົງກັນ",
      "auth.passwordWeak": "ລະຫັດຕ້ອງ >= 8 ຕົວ ແລະມີ A-Z a-z 0-9 ແລະສັນຍາລັກ",
      "auth.registerSuccess": "ສະໝັກສຳເລັດ!",
      "auth.registerFail": "ຊື່ຜູ້ໃຊ້ຫຼືອີເມວນີ້ມີຢູ່ແລ້ວ!",
      "auth.loginFail": "ຊື່ຫຼືລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ (ກະລຸນາກວດສອບຕົວພິມໃຫຍ່-ນ້ອຍ)",
      "app.redirecting": "ກຳລັງນຳໄປ..."
    },
    th: {
      "nav.home": "หน้าหลัก",
      "nav.profile": "โปรไฟล์",
      "nav.friends": "เพื่อน",
      "nav.note": "แจ้งเตือน",
      "nav.message": "ข้อความ",
      "nav.settings": "ตั้งค่า",
      "nav.backSettings": "กลับไปหน้าตั้งค่า",
      "common.loading": "กำลังโหลด...",
      "common.submit": "ส่ง",
      "common.cancel": "ยกเลิก",
      "common.save": "บันทึก",
      "common.downloadFile": "ดาวน์โหลดไฟล์",
      "common.fileNone": "ยังไม่ได้เลือกไฟล์",
      "time.justNow": "เมื่อสักครู่",
      "time.minuteAgo": "{count} นาทีที่แล้ว",
      "time.hourAgo": "{count} ชั่วโมงที่แล้ว",
      "time.dayAgo": "{count} วันที่แล้ว",
      "time.weekAgo": "{count} สัปดาห์ที่แล้ว",
      "time.monthAgo": "{count} เดือนที่แล้ว",
      "time.yearAgo": "{count} ปีที่แล้ว",
      "feed.title": "ฟีดสังคม",
      "feed.placeholder": "คุณกำลังคิดอะไรอยู่?",
      "feed.uploadImage": "อัปโหลด",
      "feed.post": "โพสต์",
      "feed.noPosts": "ยังไม่มีโพสต์",
      "feed.commentPlaceholder": "เขียนความคิดเห็น...",
      "feed.replyPlaceholder": "พิมพ์คำตอบกลับ...",
      "feed.reply": "ตอบกลับ",
      "feed.emptyPostError": "กรุณาพิมพ์ข้อความหรือเลือกรูปภาพ",
      "feed.postSuccess": "โพสต์สำเร็จ!",
      "feed.postFailed": "โพสต์ไม่สำเร็จ",
      "feed.loadFailed": "เกิดข้อผิดพลาดในการโหลดโพสต์",
      "feed.commentRequired": "กรุณาพิมพ์ความคิดเห็น",
      "feed.replyRequired": "กรุณาพิมพ์คำตอบกลับ",
      "feed.commentFailed": "ไม่สามารถส่งความคิดเห็นได้",
      "feed.replyFailed": "ไม่สามารถส่งคำตอบกลับได้",
      "feed.noComments": "ยังไม่มีความคิดเห็น",
      "friends.title": "รายชื่อเพื่อน",
      "friends.searchPlaceholder": "ค้นหาเพื่อน...",
      "friends.requests": "คำขอเป็นเพื่อน",
      "friends.myFriends": "เพื่อนของฉัน",
      "friends.sendMessage": "ส่งข้อความ",
      "friends.remove": "ลบเพื่อน",
      "friends.accept": "ยอมรับ",
      "friends.reject": "ปฏิเสธ",
      "friends.sendRequest": "ส่งคำขอเป็นเพื่อน",
      "friends.noFriends": "ยังไม่มีเพื่อน",
      "friends.noRequests": "ไม่มีคำขอเป็นเพื่อน",
      "friends.noUsers": "ไม่พบผู้ใช้",
      "friends.accepted": "ยอมรับคำขอสำเร็จ!",
      "friends.rejected": "ปฏิเสธคำขอสำเร็จ",
      "friends.requestSent": "ส่งคำขอเป็นเพื่อนสำเร็จ!",
      "friends.requestFailed": "ส่งคำขอไม่สำเร็จ",
      "friends.removeConfirm": "คุณต้องการลบเพื่อนคนนี้จริงหรือไม่?",
      "friends.removeSuccess": "ลบเพื่อนสำเร็จ",
      "messages.title": "ข้อความ",
      "messages.friendsHeader": "รายชื่อเพื่อน",
      "messages.loadingFriends": "กำลังโหลดรายชื่อเพื่อน...",
      "messages.emptyChat": "เลือกเพื่อนเพื่อเริ่มแชต",
      "messages.attachFile": "แนบไฟล์",
      "messages.inputPlaceholder": "พิมพ์ข้อความ...",
      "messages.send": "ส่ง",
      "messages.noName": "ไม่มีชื่อ",
      "messages.unknownSender": "ไม่ทราบชื่อ",
      "messages.audioUnsupported": "เบราว์เซอร์ไม่รองรับเสียง",
      "messages.videoUnsupported": "เบราว์เซอร์ไม่รองรับวิดีโอ",
      "messages.downloadPdf": "ดาวน์โหลด PDF",
      "messages.downloadFile": "ดาวน์โหลดไฟล์",
      "note.title": "โพสต์ที่เคยแสดงความคิดเห็น",
      "note.empty": "คุณยังไม่ได้แสดงความคิดเห็นในโพสต์ใดเลย",
      "note.loadFailed": "ไม่สามารถโหลดโพสต์ได้",
      "note.likeFailed": "ไม่สามารถกดถูกใจโพสต์ได้",
      "note.addCommentFailed": "ไม่สามารถเพิ่มความคิดเห็นได้",
      "profile.title": "โปรไฟล์",
      "profile.userTitle": "โปรไฟล์ผู้ใช้",
      "profile.posts": "โพสต์",
      "profile.friends": "เพื่อน",
      "profile.edit": "แก้ไขโปรไฟล์",
      "profile.editTitle": "แก้ไขโปรไฟล์",
      "profile.username": "ชื่อผู้ใช้:",
      "profile.newPhoto": "รูปโปรไฟล์ใหม่",
      "profile.saveChanges": "บันทึกการเปลี่ยนแปลง",
      "profile.sendRequest": "ส่งคำขอเป็นเพื่อน",
      "profile.alreadyFriend": "เป็นเพื่อนแล้ว",
      "profile.pending": "รอการตอบรับ",
      "profile.notFound": "ไม่พบโปรไฟล์",
      "profile.loadFailed": "เกิดข้อผิดพลาดในการโหลดโปรไฟล์",
      "profile.noPosts": "ยังไม่มีโพสต์",
      "profile.showPostsFailed": "ไม่มีโพสต์ที่จะแสดง",
      "profile.updateSuccess": "อัปเดตโปรไฟล์สำเร็จ!",
      "profile.updateFailed": "อัปเดตไม่สำเร็จ",
      "profile.connectionError": "เกิดข้อผิดพลาดในการเชื่อมต่อ",
      "profile.unknownUser": "ไม่ทราบชื่อ",
      "settings.title": "ตั้งค่า",
      "settings.language": "ภาษา",
      "settings.theme": "เปลี่ยนรูปแบบสี (Theme)",
      "settings.theme.default": "ธีมเดิม",
      "settings.theme.green": "ธีมสีเขียว",
      "settings.theme.pink": "ธีมสีชมพู",
      "settings.theme.light": "ธีมสว่าง",
      "settings.personal": "ข้อมูลส่วนตัว",
      "settings.saveProfile": "บันทึกข้อมูล",
      "settings.password": "เปลี่ยนรหัสผ่าน",
      "settings.newPassword": "รหัสผ่านใหม่",
      "settings.confirmPassword": "ยืนยันรหัสผ่านใหม่",
      "settings.passwordHint": "รหัสต้องมีอย่างน้อย 8 ตัว และมี A-Z, a-z, 0-9 และสัญลักษณ์",
      "settings.changePassword": "เปลี่ยนรหัสผ่าน",
      "settings.support": "ช่องทางติดต่อช่วยเหลือ",
      "settings.goSupport": "ไปหน้าติดต่อผู้ดูแลเว็บ",
      "settings.account": "บัญชี",
      "settings.logout": "ออกจากระบบ",
      "settings.deleteAccount": "ลบบัญชีผู้ใช้",
      "settings.saved": "บันทึกข้อมูลสำเร็จ",
      "settings.saveFail": "บันทึกไม่สำเร็จ",
      "settings.themeOk": "เปลี่ยน Theme สำเร็จ",
      "settings.badPassword": "Password ไม่ผ่านเงื่อนไข",
      "settings.pwMismatch": "Confirm password ไม่ตรงกัน",
      "settings.passwordChanged": "เปลี่ยนรหัสผ่านสำเร็จ",
      "settings.passwordChangeFail": "เปลี่ยนรหัสไม่สำเร็จ",
      "settings.deleteConfirm": "ยืนยันลบบัญชีถาวร?",
      "settings.deleteSuccess": "ลบบัญชีสำเร็จ",
      "settings.deleteFail": "ลบบัญชีไม่สำเร็จ",
      "support.title": "ติดต่อฝ่ายช่วยเหลือ",
      "support.pageTitle": "ติดต่อช่วยเหลือ",
      "support.contactTitle": "ข้อมูลติดต่อ",
      "support.facebook": "Facebook",
      "support.gmail": "Gmail",
      "support.tel": "เบอร์โทร",
      "support.whatsapp": "WhatsApp",
      "support.subject": "หัวข้อปัญหา",
      "support.message": "รายละเอียดปัญหา",
      "support.send": "ส่งคำร้องขอ",
      "support.fillAll": "กรุณากรอกข้อมูลให้ครบ",
      "support.success": "ส่งคำร้องขอสำเร็จ",
      "support.fail": "ส่งไม่สำเร็จ",
      "auth.loginTitle": "เข้าสู่ระบบ - LaoVerse",
      "auth.registerTitle": "สมัครสมาชิก - LaoVerse",
      "auth.loginHeading": "เข้าสู่ระบบ",
      "auth.registerHeading": "สมัครสมาชิก",
      "auth.username": "ชื่อ",
      "auth.email": "อีเมล",
      "auth.password": "รหัสผ่าน",
      "auth.confirmPassword": "ยืนยันรหัสผ่าน",
      "auth.login": "เข้าสู่ระบบ",
      "auth.register": "สมัคร",
      "auth.noAccount": "ยังไม่มีบัญชี?",
      "auth.haveAccount": "มีบัญชีอยู่แล้ว?",
      "auth.fillRegister": "กรอกข้อมูลให้ครบถ้วน",
      "auth.fillLogin": "กรอกชื่อและรหัสผ่านให้ครบถ้วน",
      "auth.passwordMismatch": "รหัสผ่านไม่ตรงกัน",
      "auth.passwordWeak": "รหัสต้อง >= 8 ตัว และมี A-Z a-z 0-9 และสัญลักษณ์",
      "auth.registerSuccess": "สมัครสำเร็จ!",
      "auth.registerFail": "ชื่อผู้ใช้หรืออีเมลนี้มีอยู่แล้ว!",
      "auth.loginFail": "ชื่อหรือรหัสผ่านไม่ถูกต้อง (กรุณาตรวจสอบตัวพิมพ์ใหญ่-เล็ก)",
      "app.redirecting": "กำลังนำไป..."
    },
    en: {
      "nav.home": "Home",
      "nav.profile": "Profile",
      "nav.friends": "Friends",
      "nav.note": "Notifications",
      "nav.message": "Messages",
      "nav.settings": "Settings",
      "nav.backSettings": "Back to settings",
      "common.loading": "Loading...",
      "common.submit": "Submit",
      "common.cancel": "Cancel",
      "common.save": "Save",
      "common.downloadFile": "Download file",
      "common.fileNone": "No file selected",
      "time.justNow": "Just now",
      "time.minuteAgo": "{count} minute(s) ago",
      "time.hourAgo": "{count} hour(s) ago",
      "time.dayAgo": "{count} day(s) ago",
      "time.weekAgo": "{count} week(s) ago",
      "time.monthAgo": "{count} month(s) ago",
      "time.yearAgo": "{count} year(s) ago",
      "feed.title": "Social Feed",
      "feed.placeholder": "What's on your mind?",
      "feed.uploadImage": "Upload",
      "feed.post": "Post",
      "feed.noPosts": "No posts yet",
      "feed.commentPlaceholder": "Write a comment...",
      "feed.replyPlaceholder": "Write a reply...",
      "feed.reply": "Reply",
      "feed.emptyPostError": "Please enter a message or choose an image",
      "feed.postSuccess": "Post created successfully!",
      "feed.postFailed": "Failed to create post",
      "feed.loadFailed": "An error occurred while loading posts",
      "feed.commentRequired": "Please enter a comment",
      "feed.replyRequired": "Please enter a reply",
      "feed.commentFailed": "Unable to send comment",
      "feed.replyFailed": "Unable to send reply",
      "feed.noComments": "No comments yet",
      "friends.title": "Friends List",
      "friends.searchPlaceholder": "Search friends...",
      "friends.requests": "Friend Requests",
      "friends.myFriends": "My Friends",
      "friends.sendMessage": "Message",
      "friends.remove": "Remove Friend",
      "friends.accept": "Accept",
      "friends.reject": "Reject",
      "friends.sendRequest": "Send Friend Request",
      "friends.noFriends": "No friends yet",
      "friends.noRequests": "No friend requests",
      "friends.noUsers": "No users found",
      "friends.accepted": "Friend request accepted!",
      "friends.rejected": "Friend request rejected",
      "friends.requestSent": "Friend request sent!",
      "friends.requestFailed": "Failed to send friend request",
      "friends.removeConfirm": "Do you really want to remove this friend?",
      "friends.removeSuccess": "Friend removed successfully",
      "messages.title": "Messages",
      "messages.friendsHeader": "Friends",
      "messages.loadingFriends": "Loading friends...",
      "messages.emptyChat": "Select a friend to start chatting",
      "messages.attachFile": "Attach file",
      "messages.inputPlaceholder": "Type a message...",
      "messages.send": "Send",
      "messages.noName": "Unnamed",
      "messages.unknownSender": "Unknown sender",
      "messages.audioUnsupported": "Your browser does not support audio",
      "messages.videoUnsupported": "Your browser does not support video",
      "messages.downloadPdf": "Download PDF",
      "messages.downloadFile": "Download file",
      "note.title": "Posts You Commented On",
      "note.empty": "You have not commented on any posts yet",
      "note.loadFailed": "Unable to load posts",
      "note.likeFailed": "Unable to like the post",
      "note.addCommentFailed": "Unable to add comment",
      "profile.title": "Profile",
      "profile.userTitle": "User Profile",
      "profile.posts": "Posts",
      "profile.friends": "Friends",
      "profile.edit": "Edit Profile",
      "profile.editTitle": "Edit Profile",
      "profile.username": "Username:",
      "profile.newPhoto": "New profile picture",
      "profile.saveChanges": "Save changes",
      "profile.sendRequest": "Send Friend Request",
      "profile.alreadyFriend": "Already friends",
      "profile.pending": "Pending approval",
      "profile.notFound": "Profile not found",
      "profile.loadFailed": "An error occurred while loading the profile",
      "profile.noPosts": "No posts yet",
      "profile.showPostsFailed": "No posts to display",
      "profile.updateSuccess": "Profile updated successfully!",
      "profile.updateFailed": "Profile update failed",
      "profile.connectionError": "Connection error",
      "profile.unknownUser": "Unknown user",
      "settings.title": "Settings",
      "settings.language": "Language",
      "settings.theme": "Change Theme",
      "settings.theme.default": "Default theme",
      "settings.theme.green": "Green theme",
      "settings.theme.pink": "Pink theme",
      "settings.theme.light": "Light theme",
      "settings.personal": "Personal Information",
      "settings.saveProfile": "Save profile",
      "settings.password": "Change Password",
      "settings.newPassword": "New password",
      "settings.confirmPassword": "Confirm new password",
      "settings.passwordHint": "Password must be 8+ chars and include A-Z, a-z, 0-9, and a symbol",
      "settings.changePassword": "Change password",
      "settings.support": "Support",
      "settings.goSupport": "Contact support",
      "settings.account": "Account",
      "settings.logout": "Logout",
      "settings.deleteAccount": "Delete user account",
      "settings.saved": "Profile updated successfully",
      "settings.saveFail": "Profile update failed",
      "settings.themeOk": "Theme changed successfully",
      "settings.badPassword": "Password does not meet requirements",
      "settings.pwMismatch": "Password confirmation does not match",
      "settings.passwordChanged": "Password changed successfully",
      "settings.passwordChangeFail": "Failed to change password",
      "settings.deleteConfirm": "Confirm permanent account deletion?",
      "settings.deleteSuccess": "Account deleted successfully",
      "settings.deleteFail": "Failed to delete account",
      "support.title": "Contact Support",
      "support.pageTitle": "Support",
      "support.contactTitle": "Contact Information",
      "support.facebook": "Facebook",
      "support.gmail": "Gmail",
      "support.tel": "Phone",
      "support.whatsapp": "WhatsApp",
      "support.subject": "Issue subject",
      "support.message": "Describe your issue",
      "support.send": "Send request",
      "support.fillAll": "Please complete all fields",
      "support.success": "Support request sent successfully",
      "support.fail": "Failed to send support request",
      "auth.loginTitle": "Login - LaoVerse",
      "auth.registerTitle": "Register - LaoVerse",
      "auth.loginHeading": "Login",
      "auth.registerHeading": "Register",
      "auth.username": "Username",
      "auth.email": "Email",
      "auth.password": "Password",
      "auth.confirmPassword": "Confirm password",
      "auth.login": "Login",
      "auth.register": "Register",
      "auth.noAccount": "Don't have an account?",
      "auth.haveAccount": "Already have an account?",
      "auth.fillRegister": "Please fill in all fields",
      "auth.fillLogin": "Please enter both username and password",
      "auth.passwordMismatch": "Passwords do not match",
      "auth.passwordWeak": "Password must be 8+ chars and include A-Z, a-z, 0-9, and a symbol",
      "auth.registerSuccess": "Registration successful!",
      "auth.registerFail": "This username or email already exists!",
      "auth.loginFail": "Incorrect username or password (check case sensitivity)",
      "app.redirecting": "Redirecting..."
    }
  };

  function normalizeLanguage(lang) {
    return SUPPORTED_LANGS.includes(lang) ? lang : DEFAULT_LANG;
  }

  function getLang() {
    try {
      return normalizeLanguage(localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG);
    } catch (error) {
      return DEFAULT_LANG;
    }
  }

  function getDictionary(lang) {
    return DICT[normalizeLanguage(lang)] || DICT[DEFAULT_LANG];
  }

  function translate(key, vars, lang) {
    const dict = getDictionary(lang || getLang());
    const fallback = DICT[DEFAULT_LANG][key] || DICT.en[key];
    let text = dict[key] || fallback || key;
    if (vars && typeof text === "string") {
      Object.keys(vars).forEach((name) => {
        text = text.replace(new RegExp(`\\{${name}\\}`, "g"), String(vars[name]));
      });
    }
    return text;
  }

  function setNodeText(node, text) {
    if (node) node.textContent = text;
  }

  function applyLanguage(lang) {
    const nextLang = normalizeLanguage(lang);
    document.documentElement.lang = nextLang;
    document.documentElement.setAttribute("data-lang", nextLang);

    document.querySelectorAll("[data-i18n]").forEach((node) => {
      setNodeText(node, translate(node.getAttribute("data-i18n"), null, nextLang));
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((node) => {
      node.placeholder = translate(node.getAttribute("data-i18n-placeholder"), null, nextLang);
    });

    document.querySelectorAll("[data-i18n-title]").forEach((node) => {
      node.title = translate(node.getAttribute("data-i18n-title"), null, nextLang);
    });

    document.querySelectorAll("[data-i18n-value]").forEach((node) => {
      node.value = translate(node.getAttribute("data-i18n-value"), null, nextLang);
    });
  }

  function setLanguage(lang) {
    const nextLang = normalizeLanguage(lang);
    try {
      localStorage.setItem(STORAGE_KEY, nextLang);
    } catch (error) {}
    applyLanguage(nextLang);
    document.dispatchEvent(new CustomEvent("laoverse:languagechange", { detail: { lang: nextLang } }));
  }

  function formatRelativeTime(dateString) {
    const normalized = /z$/i.test(dateString) ? dateString : `${dateString}Z`;
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return "";
    const diffInSeconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return translate("time.justNow");
    if (diffInSeconds < 3600) return translate("time.minuteAgo", { count: Math.floor(diffInSeconds / 60) });
    if (diffInSeconds < 86400) return translate("time.hourAgo", { count: Math.floor(diffInSeconds / 3600) });
    if (diffInSeconds < 604800) return translate("time.dayAgo", { count: Math.floor(diffInSeconds / 86400) });
    if (diffInSeconds < 2592000) return translate("time.weekAgo", { count: Math.floor(diffInSeconds / 604800) });
    if (diffInSeconds < 31536000) return translate("time.monthAgo", { count: Math.floor(diffInSeconds / 2592000) });
    return translate("time.yearAgo", { count: Math.floor(diffInSeconds / 31536000) });
  }

  function setupExclusiveMediaPlayback() {
    if (window.__laoverseExclusiveMediaBound) return;
    window.__laoverseExclusiveMediaBound = true;

    document.addEventListener("play", function (event) {
      const current = event.target;
      if (!(current instanceof HTMLMediaElement)) return;

      document.querySelectorAll("audio, video").forEach((media) => {
        if (media !== current) {
          try {
            media.pause();
          } catch (error) {}
        }
      });
    }, true);
  }

  window.LanguageManager = {
    getLanguage: getLang,
    getDictionary,
    translate,
    t: translate,
    setLanguage,
    applyLanguage,
    formatRelativeTime
  };

  setupExclusiveMediaPlayback();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      applyLanguage(getLang());
    });
  } else {
    applyLanguage(getLang());
  }
})();
