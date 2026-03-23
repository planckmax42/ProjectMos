package com.bems.ai.repository;

import com.bems.ai.model.dto.ConversationVO;
import com.bems.ai.model.entity.ConversationMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ConversationMessageRepository extends JpaRepository<ConversationMessage, Long> {

    List<ConversationMessage> findByConversationIdOrderByCreatedAtAsc(String conversationId);

    @Query("""
            select new com.bems.ai.model.dto.ConversationVO(m.conversationId, max(m.createdAt), count(m.id))
            from ConversationMessage m
            group by m.conversationId
            order by max(m.createdAt) desc
            """)
    List<ConversationVO> findConversationSummaries();

    @Query("""
            select m from ConversationMessage m
            where m.conversationId = :conversationId
            order by m.createdAt desc
            """)
    List<ConversationMessage> findLatestByConversationId(@Param("conversationId") String conversationId);

    void deleteByConversationId(String conversationId);
}
