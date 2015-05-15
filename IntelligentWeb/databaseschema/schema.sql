CREATE DATABASE  IF NOT EXISTS `intelligent_web` /*!40100 DEFAULT CHARACTER SET utf8 */;
USE `intelligent_web`;
-- MySQL dump 10.13  Distrib 5.6.23, for Win64 (x86_64)
--
-- Host: jamesmcilveen.com    Database: intelligent_web
-- ------------------------------------------------------
-- Server version	5.5.41-cll-lve

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `foursqaure_users`
--

DROP TABLE IF EXISTS `foursqaure_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `foursqaure_users` (
  `foursqaure_id` varchar(25) NOT NULL,
  `twitter_user_fk_id` bigint(20) DEFAULT NULL,
  `firstName` varchar(45) DEFAULT NULL,
  `lastName` varchar(45) DEFAULT NULL,
  `female` binary(1) DEFAULT NULL,
  `photoURL` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`foursqaure_id`),
  KEY `twitter_id_fk_idx` (`twitter_user_fk_id`),
  CONSTRAINT `twitter_fk_id` FOREIGN KEY (`twitter_user_fk_id`) REFERENCES `twitter_users` (`twitterID`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `foursqaure_venue`
--

DROP TABLE IF EXISTS `foursqaure_venue`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `foursqaure_venue` (
  `checkinID` varchar(25) NOT NULL,
  `venue_id` varchar(25) NOT NULL,
  `name` varchar(25) DEFAULT NULL,
  `lat` decimal(18,14) DEFAULT NULL,
  `long` decimal(18,14) DEFAULT NULL,
  `user_id_fk` varchar(25) DEFAULT NULL,
  `datetime` int(13) DEFAULT NULL,
  `tweet_id_fk` bigint(30) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `rating` varchar(20) DEFAULT NULL,
  `likes` int(11) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`checkinID`),
  UNIQUE KEY `checkinID_UNIQUE` (`checkinID`),
  KEY `foursqaure_user_id_fk_idx` (`user_id_fk`),
  KEY `tweetId_idx` (`tweet_id_fk`),
  CONSTRAINT `foursqaure_fk_id` FOREIGN KEY (`user_id_fk`) REFERENCES `foursqaure_users` (`foursqaure_id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `tweet_fk_id` FOREIGN KEY (`tweet_id_fk`) REFERENCES `tweets` (`tweetId`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `tweets`
--

DROP TABLE IF EXISTS `tweets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tweets` (
  `tweetId` bigint(30) NOT NULL,
  `tweetText` varchar(141) NOT NULL,
  `tweetDate` int(15) NOT NULL,
  `screenID` bigint(20) NOT NULL,
  PRIMARY KEY (`tweetId`),
  UNIQUE KEY `tweetId_UNIQUE` (`tweetId`),
  KEY `tweetID_idx` (`screenID`),
  CONSTRAINT `twitter_user_id_fk` FOREIGN KEY (`screenID`) REFERENCES `twitter_users` (`twitterID`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `twitter_users`
--

DROP TABLE IF EXISTS `twitter_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `twitter_users` (
  `twitterID` bigint(20) NOT NULL,
  `screenName` varchar(16) NOT NULL,
  `name` varchar(45) DEFAULT NULL,
  `location` varchar(45) DEFAULT NULL,
  `website` varchar(100) DEFAULT NULL,
  `joined` int(15) DEFAULT NULL,
  `description` varchar(161) DEFAULT NULL,
  `image_url` varchar(100) DEFAULT NULL,
  `user_url` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`twitterID`),
  UNIQUE KEY `twitterID_UNIQUE` (`twitterID`),
  UNIQUE KEY `screenName_UNIQUE` (`screenName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `venues`
--

DROP TABLE IF EXISTS `venues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `venues` (
  `tweet_fk_id` bigint(30) NOT NULL,
  `name` varchar(40) DEFAULT NULL,
  `lat` decimal(12,7) DEFAULT NULL,
  `long` decimal(12,7) DEFAULT NULL,
  PRIMARY KEY (`tweet_fk_id`),
  UNIQUE KEY `tweet_fk_id_UNIQUE` (`tweet_fk_id`),
  KEY `tweetID_idx` (`tweet_fk_id`),
  KEY `venueNameID_idx` (`name`),
  CONSTRAINT `id` FOREIGN KEY (`tweet_fk_id`) REFERENCES `tweets` (`tweetId`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2015-05-15 22:44:17
