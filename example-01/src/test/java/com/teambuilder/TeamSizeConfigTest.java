/**
 * Unit tests for the {@link TeamSizeConfig} class.
 *
 * <p>Verifies that valid configurations are accepted and that all
 * invalid configurations are rejected with appropriate error messages.</p>
 *
 * @author Bruce Green
 * @since 2026-03-23
 */
package com.teambuilder;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.assertThatCode;

class TeamSizeConfigTest {

    @Test
    void validConfigurationPassesValidation() {
        TeamSizeConfig config = new TeamSizeConfig(4, 3, 5);

        assertThatCode(config::validate).doesNotThrowAnyException();
    }

    @Test
    void idealEqualsMinEqualsMaxIsValid() {
        TeamSizeConfig config = new TeamSizeConfig(5, 5, 5);

        assertThatCode(config::validate).doesNotThrowAnyException();
    }

    @Test
    void minGreaterThanMaxIsRejected() {
        TeamSizeConfig config = new TeamSizeConfig(4, 6, 3);

        assertThatThrownBy(config::validate)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Minimum size")
                .hasMessageContaining("must not exceed maximum size");
    }

    @Test
    void idealBelowMinIsRejected() {
        TeamSizeConfig config = new TeamSizeConfig(2, 3, 5);

        assertThatThrownBy(config::validate)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Ideal size")
                .hasMessageContaining("must be between");
    }

    @Test
    void idealAboveMaxIsRejected() {
        TeamSizeConfig config = new TeamSizeConfig(6, 3, 5);

        assertThatThrownBy(config::validate)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Ideal size")
                .hasMessageContaining("must be between");
    }

    @Test
    void minSizeLessThanOneIsRejected() {
        TeamSizeConfig config = new TeamSizeConfig(1, 0, 5);

        assertThatThrownBy(config::validate)
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Minimum team size must be at least 1");
    }

    @Test
    void maxSizeLessThanOneIsRejected() {
        TeamSizeConfig config = new TeamSizeConfig(0, 0, 0);

        assertThatThrownBy(config::validate)
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void gettersReturnConstructorValues() {
        TeamSizeConfig config = new TeamSizeConfig(4, 3, 5);

        assertThat(config.getIdealSize()).isEqualTo(4);
        assertThat(config.getMinSize()).isEqualTo(3);
        assertThat(config.getMaxSize()).isEqualTo(5);
    }
}
