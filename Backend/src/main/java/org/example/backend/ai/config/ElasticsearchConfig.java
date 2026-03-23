package org.example.backend.ai.config;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.json.jackson.JacksonJsonpMapper;
import co.elastic.clients.transport.ElasticsearchTransport;
import co.elastic.clients.transport.rest_client.RestClientTransport;
import org.apache.http.HttpHost;
import org.elasticsearch.client.RestClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({DeepSeekProperties.class, DashScopeProperties.class, RagProperties.class})
public class ElasticsearchConfig {

    @Bean(destroyMethod = "close")
    public RestClient restClient(
            @Value("${bems.elasticsearch.host}") String host,
            @Value("${bems.elasticsearch.port}") int port,
            @Value("${bems.elasticsearch.scheme:http}") String scheme) {
        return RestClient.builder(new HttpHost(host, port, scheme)).build();
    }

    @Bean
    public ElasticsearchTransport elasticsearchTransport(RestClient restClient) {
        return new RestClientTransport(restClient, new JacksonJsonpMapper());
    }

    @Bean
    public ElasticsearchClient elasticsearchClient(ElasticsearchTransport transport) {
        return new ElasticsearchClient(transport);
    }
}
