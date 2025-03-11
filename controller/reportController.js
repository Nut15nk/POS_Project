// controller/reportController.js
const { Report, User } = require('../models/product_config');

// สร้างรายงานปัญหา (สำหรับ Seller)
const createReport = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ status: 'error', message: 'กรุณากรอกข้อความรายงาน' });
    }

    if (req.user.role !== 'seller') {
      return res.status(403).json({ status: 'error', message: 'เฉพาะผู้ขายเท่านั้นที่สามารถรายงานปัญหาได้' });
    }

    const report = new Report({
      message,
      createdBy: req.user.id,
    });

    const savedReport = await report.save();
    res.status(201).json({
      status: 'OK',
      message: 'ส่งรายงานปัญหาสำเร็จ',
      report: {
        id: savedReport._id,
        message: savedReport.message,
        status: savedReport.status,
        createdAt: savedReport.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการส่งรายงาน', error: err.message });
  }
};

// ดึงรายการรายงาน (สำหรับ Admin)
const getReports = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'เฉพาะแอดมินเท่านั้นที่สามารถดูรายงานได้' });
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 10, 1);
    const skip = (page - 1) * limit;

    const totalReports = await Report.countDocuments();
    const reports = await Report.find()
      .populate('createdBy', 'email fname lname')
      .skip(skip)
      .limit(limit);

    res.json({
      status: 'OK',
      message: 'ดึงข้อมูลรายงานสำเร็จ',
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalReports / limit),
        totalReports,
        limit,
      },
      reports: reports.map((report) => ({
        id: report._id,
        message: report.message,
        createdBy: report.createdBy
          ? {
              id: report.createdBy._id,
              email: report.createdBy.email || '',
              fname: report.createdBy.fname || '',
              lname: report.createdBy.lname || '',
            }
          : { id: '', email: '', fname: '', lname: '' },
        status: report.status,
        createdAt: report.createdAt,
      })),
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการดึงรายงาน', error: err.message });
  }
};

// อัปเดตสถานะรายงาน (สำหรับ Admin)
const updateReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'เฉพาะแอดมินเท่านั้นที่สามารถอัปเดตสถานะได้' });
    }

    if (!status || !['pending', 'resolved'].includes(status)) {
      return res.status(400).json({ status: 'error', message: 'สถานะไม่ถูกต้อง' });
    }

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบรายงาน' });
    }

    report.status = status;
    report.updatedAt = Date.now();
    const updatedReport = await report.save();

    res.json({
      status: 'OK',
      message: 'อัปเดตสถานะรายงานสำเร็จ',
      report: {
        id: updatedReport._id,
        message: updatedReport.message,
        status: updatedReport.status,
        createdAt: updatedReport.createdAt,
        updatedAt: updatedReport.updatedAt,
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ', error: err.message });
  }
};

const deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;


    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'error', message: 'เฉพาะแอดมินเท่านั้นที่สามารถลบรายงานได้' });
    }


    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ status: 'error', message: 'ไม่พบรายงาน' });
    }

    await Report.findByIdAndDelete(reportId);

    res.json({
      status: 'OK',
      message: 'ลบรายงานสำเร็จ',
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'เกิดข้อผิดพลาดในการลบรายงาน', error: err.message });
  }
};


module.exports = {
  createReport,
  getReports,
  updateReport,
  deleteReport,
};