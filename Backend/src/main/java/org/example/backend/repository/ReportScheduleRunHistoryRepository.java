package org.example.backend.repository;

import org.example.backend.entity.ReportScheduleRunHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReportScheduleRunHistoryRepository extends JpaRepository<ReportScheduleRunHistory, Long> {

    Page<ReportScheduleRunHistory> findByScheduleIdOrderByTriggeredAtDesc(Long scheduleId, Pageable pageable);
}

