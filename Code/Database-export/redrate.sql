-- MySQL dump 10.13  Distrib 8.0.23, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: projectone
-- ------------------------------------------------------
-- Server version	8.0.23

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `acties`
--

DROP TABLE IF EXISTS `acties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `acties` (
  `actieid` int NOT NULL AUTO_INCREMENT,
  `beschrijving` varchar(245) NOT NULL,
  PRIMARY KEY (`actieid`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `acties`
--

LOCK TABLES `acties` WRITE;
/*!40000 ALTER TABLE `acties` DISABLE KEYS */;
INSERT INTO `acties` VALUES (1,'actuator aan/uitschakelen'),(2,'waarde gewicht bijhouden'),(3,'waarde temperatuur bijhouden'),(4,'waarde luchtvochtigheid bijhouden');
/*!40000 ALTER TABLE `acties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `devices`
--

DROP TABLE IF EXISTS `devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devices` (
  `deviceid` int NOT NULL AUTO_INCREMENT,
  `naam` varchar(145) NOT NULL,
  `beschrijving` varchar(245) NOT NULL,
  `type` varchar(45) NOT NULL,
  `meeteenheid` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`deviceid`),
  KEY `naam` (`naam`),
  KEY `type` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devices`
--

LOCK TABLES `devices` WRITE;
/*!40000 ALTER TABLE `devices` DISABLE KEYS */;
INSERT INTO `devices` VALUES (1,'RGB SM5050','led strip','actuator',NULL),(2,'HX711','gewicht','sensor','kg'),(3,'HIH4010','relatieve luchtvochtigheid','sensor','%'),(4,'DS18B20','temperatuur','sensor','°C'),(5,'PAM8302','amplifier speaker','actuator',NULL),(6,'LCD','16 x 2 karakters scherm','actuator',NULL);
/*!40000 ALTER TABLE `devices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historiek`
--

DROP TABLE IF EXISTS `historiek`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historiek` (
  `historiekid` int NOT NULL AUTO_INCREMENT,
  `datumtijd` datetime NOT NULL,
  `gemetenwaarde` float DEFAULT NULL,
  `status` tinyint DEFAULT NULL,
  `note` varchar(245) DEFAULT NULL,
  `deviceid` int NOT NULL,
  `actieid` int NOT NULL,
  PRIMARY KEY (`historiekid`),
  KEY `fk_historiek_devices_idx` (`deviceid`),
  KEY `fk_historiek_acties1_idx` (`actieid`),
  KEY `datumtijd` (`datumtijd`),
  CONSTRAINT `fk_historiek_acties1` FOREIGN KEY (`actieid`) REFERENCES `acties` (`actieid`),
  CONSTRAINT `fk_historiek_devices` FOREIGN KEY (`deviceid`) REFERENCES `devices` (`deviceid`)
) ENGINE=InnoDB AUTO_INCREMENT=101 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historiek`
--

LOCK TABLES `historiek` WRITE;
/*!40000 ALTER TABLE `historiek` DISABLE KEYS */;
/*!40000 ALTER TABLE `historiek` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-05-23 16:30:47