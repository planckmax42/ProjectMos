package org.example.backend.service;

import lombok.RequiredArgsConstructor;
import org.example.backend.dto.TimeSummaryDto;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.Writer;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final StatisticsService statisticsService;

    public void exportTimeSummaryToCsv(
            Long buildingId,
            LocalDateTime start,
            LocalDateTime end,
            String granularity,
            Writer writer
    ) throws IOException {
        List<TimeSummaryDto> data = statisticsService.getTimeSummary(buildingId, start, end, granularity);

        // Write CSV header
        writer.write("timeBucket,electricityKwh,waterM3,hvacKwh\n");

        // Write data rows
        for (TimeSummaryDto row : data) {
            writer.write(String.format("%s,%s,%s,%s\n",
                    row.getTimeBucket(),
                    row.getElectricityKwh(),
                    row.getWaterM3(),
                    row.getHvacKwh()
            ));
        }

        writer.flush();
    }
}
