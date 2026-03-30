import React from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, FileText } from 'lucide-react';

// 날짜 포맷 헬퍼
const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const dayOfWeek = days[new Date(dateStr).getDay()];
    return `${y}년 ${m}월 ${d}일 (${dayOfWeek})`;
};

// 텍스트 → 라인 배열로 변환
const parseLines = (text) => {
    if (!text) return [];
    return text.split('\n').filter(l => l.trim());
};

// 섹션 내용 렌더링 (PDF용 순수 텍스트 스타일)
const SectionContent = ({ text }) => {
    const lines = parseLines(text);
    if (lines.length === 0) {
        return <p className="pdf-empty">-</p>;
    }
    return (
        <ul className="pdf-list">
            {lines.map((line, i) => {
                const trimmed = line.trim();
                const isBullet = trimmed.startsWith('-') || trimmed.startsWith('•');
                const content = isBullet ? trimmed.substring(1).trim() : trimmed;
                const leadingSpaces = line.search(/\S|$/);
                const isSubItem = leadingSpaces >= 4;
                return (
                    <li key={i} className={isSubItem ? 'pdf-subitem' : 'pdf-item'}>
                        {content}
                    </li>
                );
            })}
        </ul>
    );
};

// 팀 카드 컴포넌트
const TeamCard = ({ minute, teamColor }) => {
    if (!minute) {
        return (
            <div className="pdf-team-card pdf-team-card--empty">
                <p className="pdf-empty-text">회의록 없음</p>
            </div>
        );
    }

    return (
        <div className="pdf-team-card" style={{ borderTopColor: teamColor }}>
            <div className="pdf-team-header" style={{ backgroundColor: teamColor + '15' }}>
                <div className="pdf-team-dot" style={{ backgroundColor: teamColor }} />
                <h3 className="pdf-team-name">{minute.department}</h3>
            </div>

            <div className="pdf-team-body">
                <div className="pdf-section">
                    <div className="pdf-section-label">
                        <span className="pdf-section-badge" style={{ backgroundColor: teamColor }}>가</span>
                        <span>보고사항</span>
                    </div>
                    <SectionContent text={minute.report} />
                </div>

                <div className="pdf-section">
                    <div className="pdf-section-label">
                        <span className="pdf-section-badge" style={{ backgroundColor: teamColor }}>나</span>
                        <span>진행업무</span>
                    </div>
                    <SectionContent text={minute.progress} />
                </div>

                <div className="pdf-section">
                    <div className="pdf-section-label">
                        <span className="pdf-section-badge" style={{ backgroundColor: teamColor }}>다</span>
                        <span>협의업무</span>
                    </div>
                    <SectionContent text={minute.discussion} />
                </div>
            </div>
        </div>
    );
};

// 팀별 색상 테마 (6개 팀)
const TEAM_COLORS = [
    '#4F46E5', // 인디고
    '#0891B2', // 시안
    '#059669', // 초록
    '#D97706', // 주황
    '#DC2626', // 빨강
    '#7C3AED', // 보라
];

const WeeklyReportPDF = ({ minutes, date, teamOrder, companyName, onClose }) => {
    // 해당 날짜의 회의록만 필터, teamOrder 순서대로 정렬
    const sortedMinutes = teamOrder
        .map(teamName => minutes.find(m => m.date === date && m.department === teamName))
        .filter(Boolean);

    // teamOrder에 없는 팀도 뒤에 추가
    const extraMinutes = minutes.filter(
        m => m.date === date && !teamOrder.includes(m.department)
    );
    const allMinutes = [...sortedMinutes, ...extraMinutes];

    // 1페이지당 2팀씩 분할 (넓은 레이아웃 확보)
    const pages = [];
    for (let i = 0; i < allMinutes.length; i += 2) {
        const chunk = allMinutes.slice(i, i + 2);
        if (chunk.length === 1) chunk.push(null); // 한 팀만 남으면 뒷자리 빈 칸 유지
        pages.push(chunk);
    }

    const handlePrint = () => {
        window.print();
    };

    const printStyles = `
        @media print {
            #root { display: none !important; }
            .pdf-modal-overlay { display: none !important; }
            
            body { 
                margin: 0 !important; 
                padding: 0 !important; 
                background: white !important; 
            }
            @page {
                size: A4 landscape;
                margin: 10mm;
            }
            .pdf-page {
                page-break-after: always;
                break-after: page;
            }
            .pdf-page:last-child {
                page-break-after: avoid;
                break-after: avoid;
            }
        }
    `;

    const reportContent = (
        <ReportContent
            date={date}
            pages={pages}
            companyName={companyName}
        />
    );

    return (
        <>
            <style>{printStyles}</style>

            {/* 오버레이 배경 - 미리보기 모달 */}
            <div
                className="pdf-modal-overlay"
                style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
                    zIndex: 9998, backdropFilter: 'blur(4px)'
                }}
                onClick={onClose}
            >
                {/* 모달 창 본체 */}
                <div
                    style={{
                        position: 'fixed', top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        background: 'white',
                        borderRadius: '16px', boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                        padding: '20px', width: '94vw', maxWidth: '1100px',
                        maxHeight: '90vh', overflowY: 'auto'
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* 모달 헤더 */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        marginBottom: '16px', paddingBottom: '16px',
                        borderBottom: '1px solid #e5e7eb'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileText style={{ width: 22, height: 22, color: '#4F46E5' }} />
                            <div>
                                <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                                    주간회의록 PDF 미리보기
                                </h2>
                                <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' }}>
                                    {formatDate(date)} · {allMinutes.length}개 팀
                                </p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={handlePrint}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '8px 18px', background: '#4F46E5', color: 'white',
                                    border: 'none', borderRadius: '8px', cursor: 'pointer',
                                    fontSize: '14px', fontWeight: 600
                                }}
                            >
                                <Printer style={{ width: 16, height: 16 }} />
                                PDF 저장 / 인쇄
                            </button>
                            <button
                                onClick={onClose}
                                style={{
                                    padding: '8px', background: '#f1f5f9', border: 'none',
                                    borderRadius: '8px', cursor: 'pointer', color: '#64748b'
                                }}
                            >
                                <X style={{ width: 18, height: 18 }} />
                            </button>
                        </div>
                    </div>

                    <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '16px', textAlign: 'center' }}>
                        💡 인쇄 다이얼로그에서 <strong>「PDF로 저장」</strong> 선택 · 용지: <strong>A4 가로</strong> · 여백: <strong>최소</strong> 권장
                    </p>

                    {/* 미리보기 컨테이너 */}
                    <div style={{ overflowX: 'auto', background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <div style={{ transform: 'scale(1)', transformOrigin: 'top left' }}>
                            {reportContent}
                        </div>
                    </div>
                </div>
            </div>

            {/* 실제 인쇄용 요소 - body 루트에 Portal로 마운트 */}
            {createPortal(
                <div className="pdf-print-root">
                    <style>{`
                        .pdf-print-root { display: none; }
                        @media print {
                            .pdf-print-root {
                                display: block !important;
                                position: absolute;
                                left: 0;
                                top: 0;
                                width: 100%;
                            }
                        }
                    `}</style>
                    {reportContent}
                </div>,
                document.body
            )}
        </>
    );
};

const ReportContent = ({ date, pages, companyName }) => {
    return (
        <div style={{ fontFamily: "'Pretendard', 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif", background: 'white' }}>
            {pages.map((pageChunk, pageIndex) => (
                <div key={pageIndex} className="pdf-page" style={pageStyle}>
                    <PageHeader 
                        date={date} 
                        companyName={companyName} 
                        page={pageIndex + 1} 
                        totalPages={pages.length} 
                    />

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        flex: 1,
                        overflow: 'hidden'
                    }}>
                        {pageChunk.map((minute, idx) => (
                            <TeamCard 
                                key={idx} 
                                minute={minute} 
                                teamColor={TEAM_COLORS[(pageIndex * 2 + idx) % TEAM_COLORS.length]} 
                            />
                        ))}
                    </div>

                    <PageFooter date={date} teamCount={pageChunk.filter(Boolean).length} />
                </div>
            ))}

            {/* 인라인 스타일 */}
            <style>{`
                .pdf-team-card {
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    border-top-width: 3px;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    background: white;
                }
                .pdf-team-card--empty {
                    border-top-color: #cbd5e1 !important;
                    background: #f8fafc;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .pdf-empty-text {
                    color: #cbd5e1;
                    font-size: 13px;
                }
                .pdf-team-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 7px 12px;
                    border-bottom: 1px solid #f1f5f9;
                }
                .pdf-team-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    flex-shrink: 0;
                }
                .pdf-team-name {
                    font-size: 14px;
                    font-weight: 700;
                    color: #1e293b;
                    margin: 0;
                }
                .pdf-team-body {
                    padding: 8px 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    flex: 1;
                }
                .pdf-section {
                    /* 고정된 1/3 비율을 해제하고 콘텐츠 길이에 맞게 차지하도록 함 */
                }
                .pdf-section-label {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    font-size: 11px;
                    font-weight: 700;
                    color: #475569;
                    margin-bottom: 3px;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .pdf-section-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 16px;
                    height: 16px;
                    border-radius: 4px;
                    color: white;
                    font-size: 10px;
                    font-weight: 800;
                    flex-shrink: 0;
                }
                .pdf-list {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }
                .pdf-item {
                    font-size: 11px;
                    color: #334155;
                    line-height: 1.5;
                    padding-left: 10px;
                    position: relative;
                }
                .pdf-item::before {
                    content: '•';
                    position: absolute;
                    left: 0;
                    color: #94a3b8;
                    font-size: 10px;
                }
                .pdf-subitem {
                    font-size: 10.5px;
                    color: #64748b;
                    line-height: 1.4;
                    padding-left: 20px;
                    position: relative;
                }
                .pdf-subitem::before {
                    content: '–';
                    position: absolute;
                    left: 10px;
                    color: #cbd5e1;
                }
                .pdf-empty {
                    font-size: 11px;
                    color: #cbd5e1;
                    margin: 0;
                    padding-left: 10px;
                }
            `}</style>
        </div>
    );
};

const pageStyle = {
    width: '277mm',
    minHeight: '190mm',
    padding: '0',
    boxSizing: 'border-box',
    background: 'white',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
};

const PageHeader = ({ date, companyName, page, totalPages }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        paddingBottom: '8px',
        borderBottom: '2px solid #1e293b',
        marginBottom: '4px'
    }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
            <h1 style={{
                fontSize: '18px',
                fontWeight: 800,
                color: '#1e293b',
                margin: 0,
                letterSpacing: '-0.02em'
            }}>
                주간회의록
            </h1>
            <span style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#4F46E5',
            }}>
                {formatDate(date)}
            </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                {companyName}
            </span>
            <span style={{
                fontSize: '11px',
                color: '#94a3b8',
                background: '#f1f5f9',
                padding: '2px 8px',
                borderRadius: '999px',
                fontWeight: 600
            }}>
                {page} / {totalPages}
            </span>
        </div>
    </div>
);

const PageFooter = ({ date }) => (
    <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '6px',
        borderTop: '1px solid #e2e8f0',
        marginTop: '4px'
    }}>
        <span style={{ fontSize: '10px', color: '#cbd5e1' }}>
            본 문서는 {formatDate(date)} 주간회의 내용을 요약한 것입니다.
        </span>
        <span style={{ fontSize: '10px', color: '#cbd5e1' }}>
            {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} 출력
        </span>
    </div>
);

export default WeeklyReportPDF;
