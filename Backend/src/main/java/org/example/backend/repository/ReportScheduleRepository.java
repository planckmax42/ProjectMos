package org.example.backend.repository;

import org.example.backend.entity.ReportSchedule;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ReportScheduleRepository extends JpaRepository<ReportSchedule, Long> {

	List<ReportSchedule> findByEnabledTrueAndRunTime(String runTime);

	@Modifying
	@Query("""
			update ReportSchedule s
			set s.lastRunAt = :triggeredAt
			where s.id = :id
			  and s.enabled = true
			  and (s.lastRunAt is null or s.lastRunAt < :periodStart)
			""")
	int markRunIfDue(
			@Param("id") Long id,
			@Param("periodStart") LocalDateTime periodStart,
			@Param("triggeredAt") LocalDateTime triggeredAt
	);
}

