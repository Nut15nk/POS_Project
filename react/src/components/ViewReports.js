import React, { useState, useEffect } from 'react';
import { getReports, updateReport } from '../api';

function ViewReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getReports();
      setReports(response.reports || []);
    } catch (err) {
      setError('ไม่สามารถดึงข้อมูลรายงานได้: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUpdateStatus = async (reportId, newStatus) => {
    if (window.confirm(`ยืนยันการเปลี่ยนสถานะเป็น "${newStatus === 'resolved' ? 'แก้ไขแล้ว' : 'รอดำเนินการ'}"?`)) {
      try {
        await updateReport(reportId, newStatus);
        fetchReports();
      } catch (err) {
        setError('ไม่สามารถอัปเดตสถานะได้: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) return <div className="loading">กำลังโหลด...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="view-reports">
      <h1>ดูรายงานปัญหา</h1>
      {reports.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>ข้อความ</th>
              <th>ผู้รายงาน</th>
              <th>วันที่รายงาน</th>
              <th>สถานะ</th>
              <th>การจัดการ</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td>{report.message}</td>
                <td>
                  {(report.createdBy.fname || 'ไม่ระบุชื่อ')} {(report.createdBy.lname || '')}
                </td>
                <td>{formatDate(report.createdAt)}</td>
                <td>
                  <span className={`status-badge status-${report.status}`}>
                    {report.status === 'pending' ? 'รอดำเนินการ' : 'แก้ไขแล้ว'}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() =>
                      handleUpdateStatus(report.id, report.status === 'pending' ? 'resolved' : 'pending')
                    }
                  >
                    {report.status === 'pending' ? 'แก้ไขแล้ว' : 'ตั้งรอดำเนินการ'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>ไม่มีรายงานปัญหา</p>
      )}
    </div>
  );
}

export default ViewReports;